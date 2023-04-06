var express = require("express");
const isUserAuthenticated = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const config = require("config");
const User = require("../models/user");
const isAdmin = require("../middleware/isAdmin");
const stripe = require("stripe")(config.get("strip_secret_key"));

var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
    res.render("index", { title: "Express application" });
});

router.get(
    "/login",
    async (req, res, next) => {
        const token = req.cookies["token"];
        if (token) {
            try {
                const decoded = jwt.verify(token, config.get("jwtSecret"));
                if (decoded) {
                    return res.redirect("/dashboard");
                }
            } catch (err) {
                console.log(err);
                return next();
            }
        } else {
            return next();
        }
    },
    async (req, res, next) => {
        res.sendFile("login.html", { root: "public/views" });
    }
);

router.get(
    "/register",
    async (req, res, next) => {
        const token = req.cookies["token"];
        try {
            if (!token) {
                return next();
            }
            const decoded = jwt.verify(token, config.get("jwtSecret"));
            if (decoded) {
                return res.redirect("/dashboard");
            }
        } catch (err) {
            console.log(err);
            return next();
        }
    },
    async (req, res, next) => {
        res.sendFile("register.html", { root: "public/views" });
    }
);

router.get(
    "/wait-for-approval",
    // async (req, res, next) => {
    //     const token = req.cookies["token"];
    //     // const token = req.header("x-auth-token");
    //     if (!token) {
    //         return res.redirect("/login");
    //     }
    //     try {
    //         const decoded = jwt.verify(token, config.get("jwtSecret"));
    //         const user = await User.findByPk(decoded.email);
    //         if (!user) {
    //             return res.redirect("/login");
    //         }
    //         if (user.role !== "pending") {
    //             return res.redirect("/dashboard");
    //         }
    //         req.user = user.toJSON();
    //         next();
    //     } catch (err) {
    //         console.log(err);
    //         return res.redirect("/login");
    //     }
    // },
    async (req, res, next) => {
        res.sendFile("wait-for-approval.html", { root: "public/views" });
    }
);

router.get("/dashboard", isUserAuthenticated, async (req, res, next) => {
    // console.log(req.user);
    if (req.user.role === "pending") {
        return res.redirect("/wait-for-approval");
    }
    if (req.user.role === "admin") {
        return res.sendFile("home.html", {
            root: "public/views/admin",
        });
    } else {
        return res.sendFile("home.html", {
            root: "public/views/users",
        });
    }
});

router.get("/users", isAdmin, async (req, res, next) => {
    res.sendFile("users.html", { root: "public/views/admin" });
});

router.get("/orders", isUserAuthenticated, async (req, res, next) => {
    if (req.user.role === "admin") {
        return res.sendFile("orders.html", {
            root: "public/views/admin",
        });
    } else {
        return res.sendFile("orders.html", {
            root: "public/views/users",
        });
    }
});

router.get("/orders/:id", isUserAuthenticated, async (req, res, next) => {
    if (req.user.role === "admin") {
        return res.sendFile("order-details.html", {
            root: "public/views/admin",
        });
    }
    if (req.user.role === "platinum") {
        return res.sendFile("order-details.html", {
            root: "public/views/platinum",
        });
    }
    if (req.user.role === "gold") {
        return res.sendFile("order-details.html", {
            root: "public/views/gold",
        });
    } else {
        return res.redirect("/dashboard");
    }
});

router.get("/services", isUserAuthenticated, async (req, res, next) => {
    if (req.user.role === "admin") {
        return res.sendFile("services.html", {
            root: "public/views/admin",
        });
    } else {
        return res.sendFile("services.html", {
            root: "public/views/users",
        });
    }
});

router.get("/inquiries", isUserAuthenticated, async (req, res, next) => {
    if (req.user.role === "admin") {
        return res.sendFile("inquiries.html", {
            root: "public/views/admin",
        });
    } else {
        return res.sendFile("inquiries.html", {
            root: "public/views/users",
        });
    }
});

router.get("/new-order", isUserAuthenticated, async (req, res, next) => {
    if (req.user.role === "admin") {
        return res.sendFile("404.html", {
            root: "public/views",
        });
    } else {
        return res.sendFile("new-order.html", {
            root: "public/views/users",
        });
    }
});

router.get("/redirect", async (req, res, next) => {
    return res.sendFile("redirect.html", { root: "public/views" });
});

module.exports = router;

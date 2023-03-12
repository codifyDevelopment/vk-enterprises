const jwt = require("jsonwebtoken");
const config = require("config");
const User = require("../models/user");

const isUserAuthenticated = async (req, res, next) => {
    const token = req.cookies["token"];
    if (!token) {
        return res.redirect("/login");
    }
    try {
        const decoded = jwt.verify(token, config.get("jwtSecret"));
        const user = await User.findByPk(decoded.email);
        if (!user) {
            return res.redirect("/login");
        }
        req.user = user.toJSON();
        next();
    } catch (err) {
        console.log(err);
        return res.redirect("/login");
    }
};

module.exports = isUserAuthenticated;

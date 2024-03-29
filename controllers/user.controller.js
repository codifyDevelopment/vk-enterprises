const User = require("../models/user");
const config = require("config");
const db = require('../db')
const nodemailer = require("nodemailer");
const Notifications = require("../models/notifications");

const registerController = async (req, res, next) => {
    const { email, password, company } = req.body;
    if (!email)
        return res
            .status(400)
            .json({ success: false, message: "Please provide an email" });
    if (!password)
        return res
            .status(400)
            .json({ success: false, message: "Please provide a password" });
    if (!company)
        return res
            .status(400)
            .json({ success: false, message: "Please provide a company" });

    try {
        const doesUserExist = await User.findByPk(email);
        if (doesUserExist) {
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }
        // if (
        //     process.env.NODE_ENV === "production" ||
        //     process.env.env === "production"
        // ) {
        //     const transporter = nodemailer.createTransport(
        //         config.get("nodemailer")
        //     );
        //     const ClientMailOptions = {
        //         from: config.get("nodemailer").auth.user,
        //         to: email,
        //         subject:
        //             "We're in the process of verifying your account. Sit back and relax for a bit!",
        //         text: `You're one step closer! You've created an account with us, but we need to verify your account and identity. It may take up to 24 hours, but we'll get back to you as soon as possible. Thank you for your patience and loyalty. If you have any questions, please contact us at ${config.get(
        //             "adminEmail"
        //         )} or 1-800-123-4567.`,
        //     };
        //     await transporter.sendMail(ClientMailOptions);
        //     const AdminMailOptions = {
        //         from: config.get("nodemailer").auth.user,
        //         to: config.get("adminEmail"),
        //         subject: "New user registered",
        //         text: `A new user has registered with the email ${email}. Please verify their account and identity. Thank you!`,
        //     };
        //     await transporter.sendMail(AdminMailOptions);
        // }
        const user = await User.create({
            email,
            password,
            company,
        });
        await Notifications.create({
            notificationFor: config.get("adminEmail"),
            notificationText: `A new user has registered with the email ${email}`,
            type: "user",
        });
        return res.status(201).json({
            success: true,
            data: user.toJSON(),
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            error: "Server Error",
        });
    }
};

const loginController = async (req, res, next) => {
    // console.log(req.body);
    const { email, password } = req.body;
    if (!email)
        return res
            .status(400)
            .json({ success: false, message: "Please provide an email" });
    if (!password)
        return res
            .status(400)
            .json({ success: false, message: "Please provide a password" });

    try {
        const user = await User.findByPk(email);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User does not exist, please register",
            });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Please check your credentials and try again",
            });
        }
        if (user.role === "pending") {
            return res.status(400).json({
                success: false,
                message: "Please wait for your account to be verified",
            });
        }
        const token = await user.getSignedJwtToken();
        res.cookie("token", token, {
            expires: new Date(Date.now() + 86400000), // 1 day
            httpOnly: true,
        });
        return res.status(200).json({
            success: true,
            data: user.toJSON(),
            token,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            error: "Server Error",
        });
    }
};

const userCount = async (req, res, next) => {
    try {
        const user = await User.findAll({
            where: {
                role: {
                    [db.Sequelize.Op.not]: ['pending', 'admin']
                }
            }
        });
        return res.status(200).json({
            success: true,
            data: user.length,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            error: "Server Error",
        });
    }
};

const logoutController = async (req, res, next) => {
    res.clearCookie("token");
    return res.status(200).json({
        success: true,
        message: "Logged out",
    });
};

module.exports = {
    registerController,
    loginController,
    logoutController,
    userCount
};

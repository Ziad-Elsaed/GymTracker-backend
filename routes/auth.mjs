import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.mjs";
import {
    regestValidation,
    loginValidation,
} from "../middlewares/authValid.mjs";
import validateResult from "../middlewares/checkValid.mjs";

const authRoutes = Router();

// registration middleware
authRoutes.post(
    "/regist",
    regestValidation,
    validateResult,
    async (req, res, next) => {
        try {
            const {
                name,
                email,
                password,
                phone,
                gender,
                birthDate,
            } = req.body;

            // Check if email already exists
            const checkEmail = await User.findOne({
                email: email
            }).exec();
            if (checkEmail)
                return res.status(409).json({
                    success: false,
                    msg: "this email already exists",
                });

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create new user with nested accountInfo
            const newUser = await User.create({
                email,
                password: hashedPassword,
                accountInfo: {
                    name,
                    phone,
                    gender,
                    birthDate
                },
            });

            return res.status(201).json({
                success: true,
                msg: "Account has been created successfully",
                user: {
                    name: newUser.accountInfo.name,
                    email: newUser.email,
                },
            });
        } catch (err) {
            next(err);
        }
    }
);

// login middleware
authRoutes.post(
    "/login",
    loginValidation,
    validateResult,
    async (req, res, next) => {
        try {
            const { email, password } = req.body;

            // Check if user exists by checking email inside accountInfo
            const checkUser = await User.findOne({ email: email }).exec();
            if (!checkUser)
                return res.status(401).json({ success: false, msg: "Incorrect email or password" });

            // Compare password
            const checkPass = await bcrypt.compare(password, checkUser.password);
            if (!checkPass)
                return res.status(401).json({ success: false, msg: "Incorrect email or password" });

            // Generate token
            const token = jwt.sign(
                { userId: checkUser.id },
                process.env.JWT_SECRET_KEY,
            );

            const { accountInfo: { name, birthDate }, healthInfo, previousRecords } = checkUser;

            return res.json({
                success: true,
                msg: "Login done successfully",
                token,
                accountInfo: {
                    name,
                    birthDate,
                    email
                },
                healthInfo,
                previousRecords
            });
        } catch (err) {
            next(err);
        }
    }
);


export default authRoutes;

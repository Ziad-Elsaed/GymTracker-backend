import { validationResult } from "express-validator";

const validateResult = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            validationErrors: errors.array().map(err => err.msg),
        });
    }

    next();
};

export default validateResult;

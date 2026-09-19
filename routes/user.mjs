import { Router } from "express";
import User from "../models/UserModel.mjs";
import Meal from "../models/MealModel.mjs";
import Exercise from "../models/ExerciseModel.mjs";
import mongoose from "mongoose";
import tokenVerfication from "../middlewares/tokenValid.mjs";
import { resetPasswordVaidation, accountDataValidation, healthDataValidation } from "../middlewares/settingValid.mjs";
import { mealIdPathValidation } from "../middlewares/mealValid.mjs";
import { workoutIDPathValidation, workoutBodyValidation } from "../middlewares/workoutValid.mjs";
import validateResult from "../middlewares/checkValid.mjs";
import { recordValidation } from "../middlewares/workoutValid.mjs";

import bcrypt from "bcrypt";
import { body } from "express-validator";

const userRoutes = Router();

// get all favourite meals
userRoutes.get("/current/fav", tokenVerfication, async (req, res, next) => {
    try {
        const { userId } = req.payload;
        const { favoriteMeals: favMeals } = await User.findById(userId);
        res.status(200).json({ success: true, favMeals });
    } catch (err) {
        next(err);
    }
});

// put a meal in favourites
userRoutes.post(
    "/current/fav/:mealId",
    tokenVerfication,
    mealIdPathValidation,
    validateResult,
    async (req, res, next) => {
        try {
            const { userId } = req.payload;
            const { mealId } = req.params;

            // check if meal is exist in fav before
            const { favoriteMeals } = await User.findById(userId);
            const alreadyExist = favoriteMeals.some((meal) =>
                meal._id.equals(mealId)
            );
            if (alreadyExist) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        msg: "this meal is already exist in favorites",
                    });
            }

            // check for meal
            const meal = await Meal.findById(mealId).lean(); // ?? why User.findById is working and this is not working ? 
            if (!meal)
                return res
                    .status(404)
                    .json({ success: false, msg: "Meal is not found" });

            // add meal to favorites
            const addMeal = await User.findByIdAndUpdate(userId, {
                $push: { favoriteMeals: meal },
            });

            res
                .status(200)
                .json({
                    success: true,
                    msg: `${meal.name} meal has been added to favorites successfully`,
                });
        } catch (err) {
            next(err);
        }
    }
);

// delete a meal from favourites (path params)
userRoutes.delete(
    "/current/fav/:mealId",
    mealIdPathValidation,
    validateResult,
    tokenVerfication,
    async (req, res, next) => {
        try {
            const { userId } = req.payload;
            const { mealId } = req.params;

            // check if meal is exist in fav before
            const { favoriteMeals } = await User.findById(userId);
            const checkExist = favoriteMeals.some((meal) => meal._id.equals(mealId));
            if (!checkExist) {
                return res
                    .status(400)
                    .json({ success: false, msg: "this meal is not exist in favorites" });
            }

            // Convert mealId to ObjectId if it's a string then delete the meal
            const mealObjectId = new mongoose.Types.ObjectId(mealId);
            const deleteMeal = await User.findByIdAndUpdate(userId, {
                $pull: { favoriteMeals: { _id: mealObjectId } },
            });

            return res
                .status(200)
                .json({
                    success: true,
                    msg: `meal removed successfully from favorites`,
                });
        } catch (err) {
            next(err);
        }
    }
);
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// user setting
// get acountInfo
userRoutes.get(
    "/current/accountInfo",
    tokenVerfication,
    async (req, res, next) => {
        try {
            const { userId } = req.payload;
            const { accountInfo } = await User.findById(userId);
            return res.status(200).json({ success: true, accountInfo });
        } catch (err) {
            next(err);
        }
    }
);

// put accountInfo
userRoutes.put(
    "/current/accountInfo",
    tokenVerfication,
    accountDataValidation,
    validateResult,
    async (req, res, next) => {
        try {
            const { userId } = req.payload;
            const {
                name,
                phoneCode,
                phoneNumber,
                gender,
                birthDate,
            } = req.body;

            const updateAccountInfo = await User.findByIdAndUpdate(userId, {
                accountInfo: {
                    name,
                    phoneCode,
                    phoneNumber,
                    gender,
                    birthDate,
                },
            }, { new: true })

            res.status(200).json({ success: true, msg: "Account updated successfully", accountInfo: updateAccountInfo.accountInfo });

        } catch (err) {
            next(err);
        }
    }
);

// get healthInfo
userRoutes.get(
    "/current/healthInfo",
    tokenVerfication,
    async (req, res, next) => {
        try {
            const { userId } = req.payload;
            const { healthInfo } = await User.findById(userId);
            return res.status(200).json({ success: true, healthInfo });
        } catch (err) {
            next(err);
        }
    }
);

// put healthInfo
userRoutes.put(
    "/current/healthInfo",
    tokenVerfication,
    healthDataValidation,
    validateResult,
    async (req, res, next) => {
        try {
            const { userId } = req.payload;
            const {
                height,
                weight,
                fitnessGoals,
                activityLevel,
                healthConditions,
                bodyFatPercentage,
                preferredWorkoutType,
                restingHeartRate
            } = req.body;
            console.log(body)
            const updateHealthInfo = await User.findByIdAndUpdate(userId, {
                healthInfo: {
                    height,
                    weight,
                    fitnessGoals,
                    activityLevel,
                    healthConditions,
                    bodyFatPercentage,
                    preferredWorkoutType,
                    restingHeartRate
                },
            }, { new: true })

            res.status(200).json({ success: true, msg: "Account updated successfully", healthInfo: updateHealthInfo.healthInfo });

        } catch (err) {
            next(err);
        }
    }
);

// patch password 
userRoutes.patch("/current/password", tokenVerfication, resetPasswordVaidation, validateResult, async (req, res, next) => {
    try {
        const { currPassword, newPassword } = req.body;
        const { userId } = req.payload;

        const checkUser = await User.findById(userId);

        const compareCurrPassword = await bcrypt.compare(currPassword, checkUser.password);
        if (!compareCurrPassword) return res.status(401).json({ success: false, msg: "password is not correct" })

        // hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // update password
        await User.findByIdAndUpdate(userId, { password: hashedNewPassword });
        res.status(200).json({ success: true, msg: "Password updated successfully. Please use your new password next time you log in." })

    } catch (err) {
        next(err);
    }
})

// delete account 
userRoutes.delete("/current", tokenVerfication, async (req, res, next) => {
    try {
        const { userId } = req.payload;
        await User.findByIdAndDelete(userId);
        return res.status(200).json({ success: true, msg: "account deleted successfully" })
    } catch (err) {
        next(err);
    }
})
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

userRoutes.get(
    "/workout/:pageNum",
    tokenVerfication,
    workoutIDPathValidation,
    validateResult,
    async (req, res, next) => {
        try {
            const { userId } = req.payload;
            const { pageNum } = req.params;

            const user = await User.findById(userId).populate({
                path: `workout${pageNum}.exercises.exerciseId`,
                model: "Exercise", 
            });

            res.status(200).json({
                success: true,
                workout: user[`workout${pageNum}`],
            });
        } catch (err) {
            next(err);
        }
    }
);

// put a workout page data 
userRoutes.put("/workout/:pageNum",
    tokenVerfication,
    workoutIDPathValidation,
    workoutBodyValidation,
    validateResult,
    async (req, res, next) => {
        try {
            const { userId } = req.payload;
            const { pageNum } = req.params;
            const { exercises } = req.body;

            // 1. Extract all exercise IDs
            const exerciseIds = exercises.map(ex => ex.exerciseId);

            // 2. Query to find how many of them exist
            const foundExercises = await Exercise.find({
                _id: { $in: exerciseIds }
            }).select('_id');

            if (foundExercises.length !== exerciseIds.length) {
                const foundIds = foundExercises.map(e => e._id.toString());
                const missingIds = exerciseIds.filter(id => !foundIds.includes(id));
                console.log(foundIds, missingIds)
                return res.status(400).json({
                    success: false,
                    msg: "Some exercise IDs are not exist or incorrect",
                    missingIds
                });
            }

            // 3. If all IDs are valid, update the workout
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    [`workout${pageNum}`]: req.body
                },
                {
                    new: true,
                    runValidators: true
                }
            );

            res.status(200).json({
                success: true,
                msg: `Workout${pageNum} updated successfully`,
                workout: updatedUser[`workout${pageNum}`]
            });

        } catch (err) {
            next(err);
        }
    }
);

// add to previouse records 
userRoutes.patch(
    "/addRecord",
    tokenVerfication,
    recordValidation,
    validateResult,
    async (req, res, next) => {
        try {
            const { userId } = req.payload;
            const newRecord = req.body;

            const user = await User.findById(userId);

            // Find existing record with the same date
            const existingIndex = user.previousRecords.findIndex(record =>
                new Date(record.date).toISOString().slice(0, 10) ===
                new Date(newRecord.date).toISOString().slice(0, 10)
            );

            if (existingIndex !== -1) {
                // Merge new properties to existing record
                const existingRecord = user.previousRecords[existingIndex];
                user.previousRecords[existingIndex] = {
                    date: existingRecord.date,
                    duration: existingRecord.duration + newRecord.duration,  // Add durations
                    volume: existingRecord.volume + newRecord.volume,        // Add volume
                    sets: existingRecord.sets + newRecord.sets,              // Add sets
                };
            } else {
                // Add new record
                user.previousRecords.push(newRecord);
            }

            await user.save();

            res.status(200).json({
                success: true,
                msg: "Previous record updated",
                previousRecords: user.previousRecords,
            });
        } catch (err) {
            next(err);
        }
    }
);


export default userRoutes;

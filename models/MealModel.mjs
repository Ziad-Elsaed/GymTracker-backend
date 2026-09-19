import mongoose from "mongoose";

const mealSchema = mongoose.Schema({})

const Meal = mongoose.model("meal", mealSchema);

export default Meal;
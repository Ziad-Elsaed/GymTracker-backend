import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema({});

const Exercise = mongoose.model("Exercise", exerciseSchema);

export default Exercise;

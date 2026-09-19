import express from "express";
import "dotenv/config";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.mjs";
import questionsRoutes from "./routes/questions.mjs";
import mealRoutes from "./routes/meals.mjs";
import userRoutes from "./routes/user.mjs";
import exerciseRoutes from "./routes/exercises.mjs";
import cors from "cors"

const app = express();

app.use(cors())
app.use(express.json())

// connect to routes 
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/exercises/", exerciseRoutes)
app.use("/api/meals", mealRoutes);
app.use("/api/questions", questionsRoutes);


// error handler middleware 
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || "Something went wrong on the server.";
    console.log(err)
    res.status(status).json({
        from: "from general handling middleware",
        errorMsg: message
    });
})

// connect to database and listen on port 
const PORT = process.env.PORT || 3000;
mongoose.connect(process.env.DATABASE_URL).then(async () => {
    return app.listen(PORT, () =>
        console.log(`server connected succesfully with database and listening on port ${PORT}`)
    );
});

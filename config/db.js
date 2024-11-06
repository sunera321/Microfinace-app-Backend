const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect("mongodb+srv://konara2021:root@micro-finace-new.fkgle.mongodb.net/?retryWrites=true&w=majority&appName=micro-finace-new", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("MongoDB connected successfully.");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1); // Stop the app if it can't connect
    }
};

module.exports = connectDB;

/**
 * DATABASE CONNECTION CONFIGURATION
 * 
 * Establishes connection to MongoDB Atlas cloud database.
 * Handles connection errors and provides feedback for troubleshooting.
 * 
 * IMPORTANT: In production, move connection string to environment variables
 * for better security and configuration management.
 */

const mongoose = require("mongoose");

/**
 * CONNECT TO MONGODB
 * Establishes connection to the cloud database with error handling
 * @returns {Promise} MongoDB connection promise
 */
const connectDB = async () => {
    try {
        // Connect to MongoDB Atlas cloud database
        await mongoose.connect("mongodb+srv://konara2021:root@micro-finace-new.fkgle.mongodb.net/?retryWrites=true&w=majority&appName=micro-finace-new", {
            useNewUrlParser: true,      // Use new URL parser for MongoDB
            useUnifiedTopology: true,   // Use new topology engine
        });
        
        console.log("MongoDB connected successfully.");
        console.log(`Connected to database: ${mongoose.connection.name}`);
        
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        console.error("Check your internet connection and database credentials");
        process.exit(1);                // Stop the application if database connection fails
    }
};

// Handle connection events for better monitoring
mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
    console.error('🚨 Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🛑 MongoDB connection closed through app termination');
    process.exit(0);
});

module.exports = connectDB;

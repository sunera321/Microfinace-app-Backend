
const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.DB_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/express-crud-db';

    // Optional: set strictQuery to avoid deprecation warnings in newer mongoose
    if (typeof mongoose.set === 'function') {
        mongoose.set('strictQuery', false);
    }

    const maxAttempts = 5;
    const retryDelay = 5000; // ms
    let attempts = 0;

    const tryConnect = async () => {
        attempts += 1;
        try {
            await mongoose.connect(uri);
            console.log('MongoDB connected successfully.');
            console.log(`Connected to database: ${mongoose.connection.name}`);
        } catch (error) {
            console.error('MongoDB connection failed:', error.message);
            console.error('Check your internet connection and database credentials (DB_URL / MONGODB_URI)');
            if (attempts < maxAttempts) {
                console.log(`Retrying to connect in ${retryDelay}ms (${attempts}/${maxAttempts})`);
                setTimeout(tryConnect, retryDelay);
            } else {
                console.error('Exceeded max MongoDB connection attempts. Database unavailable.');
                // Do not exit immediately; allow process to continue for diagnostics.
                // In production you might want to exit or alert monitoring systems here.
            }
        }
    };

    tryConnect();
};

// Handle connection events for better monitoring
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
    } catch (e) {
        console.error('Error closing MongoDB connection during shutdown', e);
    }
    process.exit(0);
});

module.exports = connectDB;

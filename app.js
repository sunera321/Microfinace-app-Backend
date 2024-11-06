const express = require("express");
const connectDB = require("./config/db");
const customerRoutes = require("./routes/customerRoutes");
const userRoutes = require("./routes/userRoutes");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable or default to 3000

// Connect to the database
connectDB();

// Middleware
app.use(cors()); // Enable CORS for all routes. You can customize the origin if needed.
app.use(express.json()); // Parses incoming JSON requests

// Routes
app.use("/customers", customerRoutes); // Mount customer routes
app.use("/users", userRoutes); // Mount user routes

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!" });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

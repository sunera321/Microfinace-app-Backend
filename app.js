/**
 * MICROFINANCE APPLICATION - BACKEND SERVER
 * 
 * This is the main entry point for the Microfinance Management System API.
 * It handles loan management, customer registration, branch/center operations,
 * and financial calculations for a microfinance institution.
 * 
 * Features:
 * - Customer and loan management
 * - Interest calculations and repayments  
 * - Branch and center operations
 * - User authentication and authorization
 * - Holiday calendar management
 * - Reporting and analytics
 */

// Import required dependencies
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Import all route modules
const customerRoutes = require("./routes/customerRoutes");     // Customer CRUD operations
const userRoutes = require("./routes/userRoutes");             // User authentication & management
const productRoutes = require("./routes/productRouter");       // Loan product definitions
const branchRoutes = require("./routes/branchRoutes");         // Branch management
const centerRoutes = require("./routes/centerRoutes");         // Center operations
const loanRoutes = require("./routes/loanRoutes");             // Loan lifecycle management
const loanApprovalRoutes = require("./routes/loanApprovalRoutes"); // Loan approval process
const repaymentRoutes = require("./routes/repaymentRoutes");   // Payment processing
const holidayRoutes = require("./routes/holidayRoutes");       // Holiday calendar
const interestRoutes = require("./routes/interestRoutes");     // Interest calculations
const reportsRoutes = require("./routes/reportsRoutes");       // Reports and analytics

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB database
connectDB();

/**
 * MIDDLEWARE CONFIGURATION
 * Set up essential middleware for request processing
 */
app.use(cors());                                    // Enable Cross-Origin Resource Sharing
app.use(express.json());                            // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));    // Parse URL-encoded form data

/**
 * HEALTH CHECK ENDPOINTS
 * Provide server status information for monitoring
 */
// Root endpoint - Basic server status
app.get("/", (req, res) => {
    res.json({ 
        message: "Microfinance API Server is running!", 
        timestamp: new Date().toISOString(),
        status: "OK"
    });
});

// Detailed health check with uptime information
app.get("/health", (req, res) => {
    res.json({ 
        status: "healthy", 
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

/**
 * API ROUTES CONFIGURATION
 * Register all business logic routes with their base paths
 */
app.use("/customers", customerRoutes);      // Customer management endpoints
app.use("/users", userRoutes);              // User authentication & CRUD
app.use("/products", productRoutes);        // Loan product management
app.use("/branches", branchRoutes);         // Branch operations
app.use("/centers", centerRoutes);         // Center management
app.use("/loan", loanRoutes);              // Loan lifecycle operations
app.use("/loan-approvals", loanApprovalRoutes); // Loan approval process
app.use("/repayments", repaymentRoutes);   // Payment processing
app.use("/holidays", holidayRoutes);       // Holiday calendar management
app.use("/interest", interestRoutes);      // Interest calculation utilities
app.use("/reports", reportsRoutes);        // Reports and analytics

/**
 * ERROR HANDLING MIDDLEWARE
 * Handle 404 errors and global application errors
*/
// 404 handler for undefined routes
app.use("*", (req, res) => {
    res.status(404).json({ 
        message: "Route not found",
        path: req.originalUrl
    });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    // Handle MongoDB validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({ 
            message: "Validation Error", 
            errors: err.errors 
        });
    }
    
    // Handle invalid MongoDB ObjectId format
    if (err.name === 'CastError') {
        return res.status(400).json({ 
            message: "Invalid ID format" 
        });
    }
    
    // Generic server error response
    res.status(500).json({ 
        message: "Internal Server Error",
        error: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
    });
});

/**
 * SERVER STARTUP
 * Start the server for local development (Vercel handles production)
 */
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

// Export the Express app for serverless deployment (Vercel)
module.exports = app;

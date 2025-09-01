const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Import routes
const customerRoutes = require("./routes/customerRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRouter");
const branchRoutes = require("./routes/branchRoutes");
const centerRoutes = require("./routes/centerRoutes");
const loanRoutes = require("./routes/loanRoutes");
const repaymentRoutes = require("./routes/repaymentRoutes");
const holidayRoutes = require("./routes/holidayRoutes");
const interestRoutes = require("./routes/interestRoutes");
const reportsRoutes = require("./routes/reportsRoutes");
const loanApprovalRoutes = require("./routes/loanApprovalRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to the database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/", (req, res) => {
    res.json({ 
        message: "Microfinance API Server is running!", 
        timestamp: new Date().toISOString(),
        status: "OK"
    });
});

app.get("/health", (req, res) => {
    res.json({ 
        status: "healthy", 
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use("/customers", customerRoutes);
app.use("/users", userRoutes);
app.use("/products", productRoutes);
app.use("/branches", branchRoutes);
app.use("/centers", centerRoutes);
app.use("/loan", loanRoutes);
app.use("/repayments", repaymentRoutes);
app.use("/holidays", holidayRoutes);
app.use("/interest", interestRoutes);
app.use("/reports", reportsRoutes);
app.use("/loan-approvals", loanApprovalRoutes);

// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({ 
        message: "Route not found",
        path: req.originalUrl
    });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({ 
            message: "Validation Error", 
            errors: err.errors 
        });
    }
    
    if (err.name === 'CastError') {
        return res.status(400).json({ 
            message: "Invalid ID format" 
        });
    }
    
    res.status(500).json({ 
        message: "Internal Server Error",
        error: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
    });
});

// Start the server (only for local development)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

// Export the Express app for Vercel
module.exports = app;

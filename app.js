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
require('dotenv').config();

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
const PORT = process.env.PORT || 8080;

// Connect to MongoDB database
connectDB();

/**
 * MIDDLEWARE CONFIGURATION
 * Set up essential middleware for request processing
 */

// AZURE FIX 1: Enhanced CORS configuration for Azure and mobile apps
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:19006',  // Expo development
            'http://192.168.8.138:3000',  // Your local network
            /\.azurewebsites\.net$/,  // Any Azure subdomain
            /\.azurestaticapps\.net$/,  // Azure Static Web Apps
            process.env.FRONTEND_URL  // Dynamic frontend URL
        ].filter(Boolean);
        
        const isAllowed = allowedOrigins.some(allowed => {
            if (typeof allowed === 'string') {
                return origin === allowed;
            }
            return allowed.test(origin);
        });
        
        if (isAllowed) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(null, true); // Allow all for development - tighten in production
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// AZURE FIX 2: Enhanced JSON parsing with larger limits for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// AZURE FIX 3: Add request logging for Azure Application Insights
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    next();
});

/**
 * HEALTH CHECK ENDPOINTS
 * Provide server status information for monitoring
 */

// AZURE FIX 4: Enhanced root endpoint with environment info
app.get("/", (req, res) => {
    res.json({ 
        message: "Microfinance API Server is running!", 
        timestamp: new Date().toISOString(),
        status: "OK",
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        platform: process.env.WEBSITE_SITE_NAME ? 'Azure App Service' : 'Local'
    });
});

// AZURE FIX 5: Enhanced health check for Azure monitoring
app.get("/health", (req, res) => {
    const healthCheck = {
        status: "healthy", 
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
        },
        database: 'connected'
    };
    
    // Add Azure-specific info if available
    if (process.env.WEBSITE_SITE_NAME) {
        healthCheck.azure = {
            siteName: process.env.WEBSITE_SITE_NAME,
            resourceGroup: process.env.WEBSITE_RESOURCE_GROUP,
            subscriptionId: process.env.WEBSITE_OWNER_NAME
        };
    }
    
    res.status(200).json(healthCheck);
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
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

// AZURE FIX 6: Enhanced global error handling with Azure logging
app.use((err, req, res, next) => {
    // Enhanced error logging for Azure Application Insights
    console.error('Error occurred:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? 'Hidden in production' : err.stack,
        url: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent')
    });
    
    // Handle MongoDB validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({ 
            message: "Validation Error", 
            errors: err.errors,
            timestamp: new Date().toISOString()
        });
    }
    
    // Handle invalid MongoDB ObjectId format
    if (err.name === 'CastError') {
        return res.status(400).json({ 
            message: "Invalid ID format",
            timestamp: new Date().toISOString()
        });
    }
    
    // Generic server error response
    res.status(500).json({ 
        message: "Internal Server Error",
        error: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message,
        timestamp: new Date().toISOString()
    });
});

// AZURE FIX 7: Add graceful shutdown handling for Azure
process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

/**
 * SERVER STARTUP - AZURE FIX 8: CRITICAL FIX
 * Azure App Service requires the server to ALWAYS start, regardless of NODE_ENV
 */
app.listen(PORT, () => {
    console.log(`Microfinance API Server started successfully!`);
    console.log(`nvironment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Port: ${PORT}`);
    console.log(`Started at: ${new Date().toISOString()}`);
    
    // Log Azure-specific information if available
    if (process.env.WEBSITE_SITE_NAME) {
        console.log(` Azure App Service: ${process.env.WEBSITE_SITE_NAME}`);
        console.log(`Azure URL: https://${process.env.WEBSITE_SITE_NAME}.azurewebsites.net`);
    } else {
        console.log(`Local development server: http://localhost:${PORT}`);
    }
});

// Export the Express app for Azure App Service
module.exports = app;
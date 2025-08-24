const express = require("express");
const connectDB = require("./config/db");
const customerRoutes = require("./routes/customerRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRouter");
const branchRoutes = require("./routes/branchRoutes");
const centerRoutes = require("./routes/centerRoutes");
const loanRoutes = require("./routes/loanRoutes")
const repaymentRoutes = require("./routes/repaymentRoutes");
const holidayRoutes = require("./routes/holidayRoutes");
const interestRoutes = require("./routes/interestRoutes");
const reportsRoutes = require("./routes/reportsRoutes");
const loanApprovalRoutes = require("./routes/loanApprovalRoutes");

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
app.use("/products", productRoutes); // Mount product routes
app.use("/branches", branchRoutes); // Mount branch routes
app.use("/centers", centerRoutes); // Mount center routes
app.use("/loan",loanRoutes )
app.use("/repayments", repaymentRoutes);
app.use("/holidays", holidayRoutes); // Mount holiday routes
app.use("/interest", interestRoutes); // Mount interest calculation routes
app.use("/reports", reportsRoutes); // Mount reports routes
app.use("/loan-approvals", loanApprovalRoutes); // Mount loan approval routes

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!" });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reportsController");

// Get overview report data
router.get("/overview", reportsController.getOverviewReport);

// Get loan report data
router.get("/loans", reportsController.getLoanReport);

// Get collection report data
router.get("/collections", reportsController.getCollectionReport);

// Get all reports data (combined)
router.get("/all", reportsController.getAllReports);

module.exports = router;

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

// Get today's collection data
router.get("/collections/today", reportsController.getTodayCollections);

// Get weekly collection data  
router.get("/collections/weekly", reportsController.getWeeklyCollections);

// Get monthly collection data
router.get("/collections/monthly", reportsController.getMonthlyCollections);

// Get collection summary (today + weekly + monthly)
router.get("/collections/summary", reportsController.getCollectionSummary);

module.exports = router;

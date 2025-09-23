const ReportsService = require("../services/reportsService");

// Get Overview Report Data
const getOverviewReport = async (req, res) => {
  try {
    const reportData = await ReportsService.getOverviewReport();
    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error("Error in getOverviewReport:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch overview report data",
      error: error.message
    });
  }
};

// Get Loan Report Data
const getLoanReport = async (req, res) => {
  try {
    const reportData = await ReportsService.getLoanReport();
    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error("Error in getLoanReport:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch loan report data",
      error: error.message
    });
  }
};

// Get Collection Report Data
const getCollectionReport = async (req, res) => {
  try {
    const reportData = await ReportsService.getCollectionReport();
    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error("Error in getCollectionReport:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch collection report data",
      error: error.message
    });
  }
};

// Get All Reports Data
const getAllReports = async (req, res) => {
  try {
    const reportData = await ReportsService.getAllReports();
    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error("Error in getAllReports:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch all report data",
      error: error.message
    });
  }
};

// Get Today's Collection Data
const getTodayCollections = async (req, res) => {
  try {
    const reportData = await ReportsService.getTodayCollections();
    res.json({
      success: true,
      data: reportData.data
    });
  } catch (error) {
    console.error("Error in getTodayCollections:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch today's collection data",
      error: error.message
    });
  }
};

// Get Weekly Collection Data
const getWeeklyCollections = async (req, res) => {
  try {
    const reportData = await ReportsService.getWeeklyCollections();
    res.json({
      success: true,
      data: reportData.data
    });
  } catch (error) {
    console.error("Error in getWeeklyCollections:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch weekly collection data",
      error: error.message
    });
  }
};

// Get Monthly Collection Data
const getMonthlyCollections = async (req, res) => {
  try {
    const reportData = await ReportsService.getMonthlyCollections();
    res.json({
      success: true,
      data: reportData.data
    });
  } catch (error) {
    console.error("Error in getMonthlyCollections:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch monthly collection data",
      error: error.message
    });
  }
};

// Get Collection Summary (Today + Weekly + Monthly)
const getCollectionSummary = async (req, res) => {
  try {
    const reportData = await ReportsService.getCollectionSummary();
    res.json({
      success: true,
      data: reportData.data
    });
  } catch (error) {
    console.error("Error in getCollectionSummary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch collection summary data",
      error: error.message
    });
  }
};

module.exports = {
  getOverviewReport,
  getLoanReport,
  getCollectionReport,
  getAllReports,
  getTodayCollections,
  getWeeklyCollections,
  getMonthlyCollections,
  getCollectionSummary
};
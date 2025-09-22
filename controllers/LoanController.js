/**
 * LOAN CONTROLLER
 * 
 * HTTP request/response handler for loan management operations.
 * Uses LoanService for complex business logic and calculations.
 * Handles document uploads, arrears calculations, and holiday adjustments.
 */

const LoanService = require("../services/loanService");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

/**
 * CLOUDINARY FILE UPLOAD CONFIGURATION
 * Handles loan document uploads to cloud storage
 */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "LoanDocuments",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });

// Configure multi-file upload for loan documents
exports.uploadLoanDocuments = upload.fields([
  { name: "loanApplication", maxCount: 1 },    // Main loan application form
  { name: "clientNIC", maxCount: 1 },          // Client's National ID Card
  { name: "guarantorNIC1", maxCount: 1 },      // First guarantor's NIC
  { name: "guarantorNIC2", maxCount: 1 },      // Second guarantor's NIC
  { name: "otherProof", maxCount: 1 },         // Additional supporting documents
]);

/**
 * CREATE LOAN
 * Process new loan application with document charges and payment calculations
 * @param {Object} req.body - Loan data (customerId, productId, grantedAmount, grantedDate)
 * @returns {Object} 201 - Created loan object
 * @returns {Object} 400/404 - Validation or not found errors
 */
exports.createLoan = async (req, res) => {
  try {
    const loan = await LoanService.createLoan(req.body, req.files);
    res.status(201).json({
      success: true,
      data: loan,
      message: 'Loan created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET LOAN BY ID
 * Retrieve specific loan with updated arrears calculation
 * @param {String} req.params.id - Loan ID
 * @returns {Object} 200 - Loan object with current arrears
 * @returns {Object} 404 - Loan not found
 * @returns {Object} 500 - Server error
 */
exports.getLoanById = async (req, res) => {
  try {
    const loan = await LoanService.getLoanById(req.params.id);
    res.status(200).json({
      success: true,
      data: loan,
      message: 'Loan retrieved successfully'
    });
  } catch (error) {
    if (error.message === 'Loan not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET ALL LOANS
 * Retrieve all loans with updated arrears calculations
 * @returns {Array} 200 - List of loans with current financial status
 * @returns {Object} 500 - Server error
 */
exports.getLoans = async (req, res) => {
  try {
    const loans = await LoanService.getAllLoans();
    res.status(200).json({
      success: true,
      data: loans,
      message: 'Loans retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * UPDATE ALL LOANS ARREARS
 * Batch update arrears calculations for all loans (maintenance endpoint)
 * @returns {Object} 200 - Update summary with count of modified loans
 * @returns {Object} 500 - Server error
 */
exports.updateAllLoansArrears = async (req, res) => {
  try {
    const result = await LoanService.updateAllLoansArrears();
    res.status(200).json({
      success: true,
      data: { updatedCount: result },
      message: `Updated arrears for ${result} loans`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * UPDATE LOAN
 * Modify existing loan details
 * @param {String} req.params.id - Loan ID
 * @param {Object} req.body - Updated loan data
 * @returns {Object} 200 - Updated loan object
 * @returns {Object} 404 - Loan not found
 * @returns {Object} 500 - Server error
 */
exports.updateLoan = async (req, res) => {
  try {
    const loan = await LoanService.updateLoan(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: loan,
      message: 'Loan updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * DELETE LOAN
 * Remove loan from system (use with caution)
 * @param {String} req.params.id - Loan ID
 * @returns {Object} 200 - Success message
 * @returns {Object} 404 - Loan not found
 * @returns {Object} 500 - Server error
 */
exports.deleteLoan = async (req, res) => {
  try {
    await LoanService.deleteLoan(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Loan deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

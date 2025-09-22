/**
 * LOAN ROUTES
 * 
 * Defines API endpoints for loan management operations.
 * Handles complete loan lifecycle including:
 * - Loan application and approval process
 * - Document upload and management
 * - Payment tracking and arrears calculation
 * - Financial status monitoring
 */

const express = require("express");
const router = express.Router();
const loanController = require("../controllers/LoanController");

/**
 * LOAN OPERATIONS
 * RESTful API endpoints for comprehensive loan management
 */

// POST /loan/upload - Create loan with document upload (preferred method)
router.post("/upload", loanController.uploadLoanDocuments, loanController.createLoan);

// POST /loan - Create loan without documents (fallback method)
router.post("/", loanController.createLoan);

// GET /loan - Get all loans with updated arrears calculations
router.get("/", loanController.getLoans);

// GET /loan/:id - Get specific loan with current financial status
router.get("/:id", loanController.getLoanById);

// PUT /loan/:id - Update loan information
router.put("/:id", loanController.updateLoan);

// PUT /loan/batch/update-arrears - Batch update arrears for all loans
router.put("/batch/update-arrears", loanController.updateAllLoansArrears);

// DELETE /loan/:id - Remove loan record (use with extreme caution)
router.delete("/:id", loanController.deleteLoan);

module.exports = router;

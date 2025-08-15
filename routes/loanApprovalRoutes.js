const express = require("express");
const router = express.Router();
const loanApprovalController = require("../controllers/loanApprovalController");

// Submit loan for approval (with document upload)
router.post(
  "/submit", 
  loanApprovalController.uploadLoanApprovalDocuments, 
  loanApprovalController.submitLoanForApproval
);

// Get all pending loan approvals
router.get("/pending", loanApprovalController.getPendingApprovals);

// Get specific approval details
router.get("/:approvalId", loanApprovalController.getApprovalDetails);

// Approve a loan (creates actual loan)
router.put("/:approvalId/approve", loanApprovalController.approveLoan);

// Reject a loan
router.put("/:approvalId/reject", loanApprovalController.rejectLoan);

module.exports = router;

const express = require("express");
const router = express.Router();
const loanController = require("../controllers/LoanController");

// 🔥 ADD THIS upload route at the top
router.post("/upload", loanController.uploadLoanDocuments, loanController.createLoan);

// 👇 Keep everything else the same
router.post("/", loanController.createLoan);
router.get("/", loanController.getLoans);
router.get("/:id", loanController.getLoanById);
router.put("/:id", loanController.updateLoan);
router.delete("/:id", loanController.deleteLoan);

module.exports = router;

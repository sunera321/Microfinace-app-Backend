const express = require("express");
const router = express.Router();
const repaymentController = require("../controllers/repaymentController");

router.get("/:loanId", repaymentController.getRepaymentsByLoanId);
router.post("/", repaymentController.createRepayment);

module.exports = router;

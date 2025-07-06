const mongoose = require("mongoose");

const repaymentSchema = new mongoose.Schema({
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: "Loan", required: true },
  amount: { type: Number, required: true },
  paidDate: { type: Date, default: Date.now },
  remarks: { type: String },
});

module.exports = mongoose.model("Repayment", repaymentSchema);

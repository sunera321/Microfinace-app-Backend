const mongoose = require("mongoose");

const eventLogSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., "REPAYMENT"
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: "Loan" },
  amount: { type: Number },
  date: { type: Date, default: Date.now },
  description: { type: String }, // optional
});

module.exports = mongoose.model("EventLog", eventLogSchema);

const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema({
  loanId: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  grantedAmount: { type: Number, required: true },
  grantedDate: { type: Date, required: true }, 
  firstDueDate: { type: Date, required: true },
  documentCharges: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  period: { type: Number, required: true },
  totalReceivable: { type: Number, required: true },
  recovered: { type: Number, default: 0 },
  outstanding: { type: Number, required: true },
  arrearsAmount: { type: Number, default: 0 },
  centerId: { type: mongoose.Schema.Types.ObjectId, ref: "Center", required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
  supportingDocuments: {
    loanApplication: { type: String },
    clientNIC: { type: String },
    guarantorNIC1: { type: String },
    guarantorNIC2: { type: String },
    otherProof: { type: String },
  },
});

module.exports = mongoose.model("Loan", loanSchema);
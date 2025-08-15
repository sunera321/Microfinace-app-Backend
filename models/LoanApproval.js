const mongoose = require("mongoose");

const loanApprovalSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  customerName: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  grantedAmount: { type: Number, required: true },
  grantedDate: { type: Date, required: true },
  centerId: { type: mongoose.Schema.Types.ObjectId, ref: "Center", required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
  
  // Calculated loan details
  interestRate: { type: Number, required: true },
  period: { type: Number, required: true },
  gracePeriod: { type: Number, required: true },
  documentCharges: { type: Number, required: true },
  totalReceivable: { type: Number, required: true },
  firstDueDate: { type: Date, required: true },
  
  // Supporting documents
  supportingDocuments: {
    loanApplication: { type: String },
    clientNIC: { type: String },
    guarantorNIC1: { type: String },
    guarantorNIC2: { type: String },
    otherProof: { type: String },
  },
  
  // Approval status
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  
  // Admin details
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: { type: Date },
  reviewComments: { type: String },
  
  // Timestamps
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("LoanApproval", loanApprovalSchema);

/**
 * LOAN MODEL
 * 
 * Core model for managing loan records in the microfinance system.
 * Tracks loan lifecycle from approval through repayment, including:
 * - Financial calculations (interest, arrears, outstanding amounts)
 * - Document management for compliance
 * - Payment tracking and history
 * - Organizational relationships (customer, product, center, branch)
 */

const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema({
  // Loan Identification
  loanId: { 
    type: String, 
    required: true, 
    unique: true,           // Ensure unique loan identifiers
    trim: true
  },
  
  // Relationship References
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Customer", 
    required: true          // Link to borrower
  },
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Product", 
    required: true          // Link to loan product terms
  },
  
  // Loan Terms and Amounts
  grantedAmount: { 
    type: Number, 
    required: true,
    min: 0                  // Prevent negative loan amounts
  },
  grantedDate: { 
    type: Date, 
    required: true 
  },
  firstDueDate: { 
    type: Date, 
    required: true          // When first payment is due
  },
  
  // Fee and Interest Calculations
  documentCharges: { 
    type: Number, 
    required: true,
    min: 0                  // Processing fee percentage
  },
  documentChargeAmount: {
    type: Number,
    default: 0,             // Calculated document charge amount
    min: 0
  },
  interestRate: { 
    type: Number, 
    required: true,
    min: 0                  // Annual interest rate percentage
  },
  period: { 
    type: Number, 
    required: true,
    min: 1                  // Number of payment periods
  },
  
  // Financial Status Tracking
  totalReceivable: { 
    type: Number, 
    required: true,
    min: 0                  // Principal + interest total
  },
  recovered: { 
    type: Number, 
    default: 0,
    min: 0                  // Amount paid by customer
  },
  outstanding: { 
    type: Number, 
    required: true,
    min: 0                  // Remaining balance
  },
  arrearsAmount: { 
    type: Number, 
    default: 0,
    min: 0                  // Overdue payment amount
  },
  
  // Organizational Links
  centerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Center", 
    required: true          // Customer's center
  },
  branchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Branch", 
    required: true          // Customer's branch
  },
  
  // Document Management
  supportingDocuments: {
    loanApplication: { type: String },    // Cloudinary URL for application form
    clientNIC: { type: String },          // Customer's national ID copy
    guarantorNIC1: { type: String },      // First guarantor's ID
    guarantorNIC2: { type: String },      // Second guarantor's ID
    otherProof: { type: String },         // Additional supporting documents
  },
  
  // Audit Fields
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create indexes for better query performance
// Note: loanId already has unique: true, so no need to create separate index
loanSchema.index({ customerId: 1 });
loanSchema.index({ productId: 1 });
loanSchema.index({ centerId: 1 });
loanSchema.index({ branchId: 1 });
loanSchema.index({ firstDueDate: 1 });
loanSchema.index({ outstanding: 1 });
loanSchema.index({ arrearsAmount: 1 });

module.exports = mongoose.model("Loan", loanSchema);
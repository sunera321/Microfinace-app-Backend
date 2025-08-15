const LoanApproval = require("../models/LoanApproval");
const Loan = require("../models/Loan");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Cloudinary file upload config (same as Loan controller)
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "LoanApprovalDocuments",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });

exports.uploadLoanApprovalDocuments = upload.fields([
  { name: "loanApplication", maxCount: 1 },
  { name: "clientNIC", maxCount: 1 },
  { name: "guarantorNIC1", maxCount: 1 },
  { name: "guarantorNIC2", maxCount: 1 },
  { name: "otherProof", maxCount: 1 },
]);

// Submit loan for approval (instead of creating directly)
exports.submitLoanForApproval = async (req, res) => {
  try {
    const { customerId, productId, grantedAmount, grantedDate } = req.body;

    // Validate required fields
    if (!customerId || !productId || !grantedAmount || !grantedDate) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Get customer and product details
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Parse dates and amounts
    const parsedGrantedDate = new Date(grantedDate);
    const amount = parseFloat(grantedAmount);

    // Calculate loan details
    const interestRate = product.interest;
    const period = product.terms;
    const gracePeriod = parseInt(product.Grace_period || 0, 10);
    const documentCharges = product.docCharges;
    const totalReceivable = amount + (amount * (interestRate / 100));
    const firstDueDate = new Date(parsedGrantedDate.getTime() + gracePeriod * 24 * 60 * 60 * 1000);

    // Handle uploaded documents
    const supportingDocuments = {
      loanApplication: req.files?.loanApplication?.[0]?.path || "",
      clientNIC: req.files?.clientNIC?.[0]?.path || "",
      guarantorNIC1: req.files?.guarantorNIC1?.[0]?.path || "",
      guarantorNIC2: req.files?.guarantorNIC2?.[0]?.path || "",
      otherProof: req.files?.otherProof?.[0]?.path || "",
    };

    // Create loan approval request
    const loanApproval = new LoanApproval({
      customerId,
      customerName: `${customer.firstName} ${customer.lastName}`,
      productId,
      grantedAmount: amount,
      grantedDate: parsedGrantedDate,
      centerId: customer.centerId,
      branchId: customer.branchId,
      interestRate,
      period,
      gracePeriod,
      documentCharges,
      totalReceivable,
      firstDueDate,
      supportingDocuments,
      status: 'pending'
    });

    const savedApproval = await loanApproval.save();

    res.status(201).json({
      message: "Loan submitted for approval successfully",
      approvalId: savedApproval._id,
      status: "pending"
    });

  } catch (error) {
    console.error("Error submitting loan for approval:", error);
    res.status(500).json({ message: "Error submitting loan for approval", error: error.message });
  }
};

// Get all pending loan approvals
exports.getPendingApprovals = async (req, res) => {
  try {
    const pendingApprovals = await LoanApproval.find({ status: 'pending' })
      .populate('customerId', 'firstName lastName phoneNumber')
      .populate('productId', 'name interest terms')
      .populate('centerId', 'name')
      .sort({ submittedAt: -1 });

    res.status(200).json(pendingApprovals);
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    res.status(500).json({ message: "Error fetching pending approvals", error: error.message });
  }
};

// Get single loan approval details
exports.getApprovalDetails = async (req, res) => {
  try {
    const { approvalId } = req.params;
    
    const approval = await LoanApproval.findById(approvalId)
      .populate('customerId', 'firstName lastName phoneNumber email address')
      .populate('productId', 'name interest terms Grace_period docCharges type')
      .populate('centerId', 'name')
      .populate('branchId', 'name');

    if (!approval) {
      return res.status(404).json({ message: "Loan approval not found" });
    }

    res.status(200).json(approval);
  } catch (error) {
    console.error("Error fetching approval details:", error);
    res.status(500).json({ message: "Error fetching approval details", error: error.message });
  }
};

// Approve loan (create actual loan)
exports.approveLoan = async (req, res) => {
  try {
    const { approvalId } = req.params;
    const { reviewComments } = req.body;

    // Find the approval request
    const approval = await LoanApproval.findById(approvalId);
    if (!approval) {
      return res.status(404).json({ message: "Loan approval not found" });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({ message: "Loan approval already processed" });
    }

    // Generate unique loan ID
    const loanId = "LN" + Date.now();

    // Create the actual loan
    const loan = new Loan({
      loanId,
      customerId: approval.customerId,
      productId: approval.productId,
      grantedAmount: approval.grantedAmount,
      grantedDate: approval.grantedDate,
      firstDueDate: approval.firstDueDate,
      documentCharges: approval.documentCharges,
      interestRate: approval.interestRate,
      period: approval.period,
      totalReceivable: approval.totalReceivable,
      recovered: 0,
      outstanding: approval.totalReceivable,
      arrearsAmount: 0,
      centerId: approval.centerId,
      branchId: approval.branchId,
      supportingDocuments: approval.supportingDocuments,
    });

    const savedLoan = await loan.save();

    // Update approval status
    approval.status = 'approved';
    approval.reviewedAt = new Date();
    approval.reviewComments = reviewComments;
    // approval.reviewedBy = req.user?.id; // Add if you have user authentication
    await approval.save();

    res.status(200).json({
      message: "Loan approved and created successfully",
      loanId: savedLoan.loanId,
      loan: savedLoan
    });

  } catch (error) {
    console.error("Error approving loan:", error);
    res.status(500).json({ message: "Error approving loan", error: error.message });
  }
};

// Reject loan
exports.rejectLoan = async (req, res) => {
  try {
    const { approvalId } = req.params;
    const { reviewComments } = req.body;

    const approval = await LoanApproval.findById(approvalId);
    if (!approval) {
      return res.status(404).json({ message: "Loan approval not found" });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({ message: "Loan approval already processed" });
    }

    // Update approval status to rejected
    approval.status = 'rejected';
    approval.reviewedAt = new Date();
    approval.reviewComments = reviewComments;
    // approval.reviewedBy = req.user?.id; // Add if you have user authentication
    await approval.save();

    res.status(200).json({
      message: "Loan rejected successfully",
      approval
    });

  } catch (error) {
    console.error("Error rejecting loan:", error);
    res.status(500).json({ message: "Error rejecting loan", error: error.message });
  }
};

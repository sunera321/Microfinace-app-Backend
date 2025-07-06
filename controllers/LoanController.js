const Loan = require("../models/Loan");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Cloudinary file upload config
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "LoanDocuments",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });

exports.uploadLoanDocuments = upload.fields([
  { name: "loanApplication", maxCount: 1 },
  { name: "clientNIC", maxCount: 1 },
  { name: "guarantorNIC1", maxCount: 1 },
  { name: "guarantorNIC2", maxCount: 1 },
  { name: "otherProof", maxCount: 1 },
]);

// Create Loan
exports.createLoan = async (req, res) => {
  try {
    const { customerId, productId, grantedAmount } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const interestRate = product.interest;
    const period = product.terms;
    const gracePeriod = parseInt(product.Grace_period || 0, 10);

    if (isNaN(gracePeriod)) {
      return res.status(400).json({ message: "Invalid Grace Period in product" });
    }

    const documentCharges = product.docCharges;
    const totalReceivable = parseFloat(grantedAmount) + (parseFloat(grantedAmount) * (interestRate / 100));
    const outstanding = totalReceivable;
    const loanId = "LN" + Date.now();

    // ✅ Safe Date calculation
    const firstDueDate = new Date(Date.now() + gracePeriod * 24 * 60 * 60 * 1000);

    const supportingDocuments = {
      loanApplication: req.files?.loanApplication?.[0]?.path || "",
      clientNIC: req.files?.clientNIC?.[0]?.path || "",
      guarantorNIC1: req.files?.guarantorNIC1?.[0]?.path || "",
      guarantorNIC2: req.files?.guarantorNIC2?.[0]?.path || "",
      otherProof: req.files?.otherProof?.[0]?.path || "",
    };

    const loan = new Loan({
      loanId,
      customerId,
      productId,
      grantedAmount,
      grantedDate: new Date(),
      firstDueDate,
      documentCharges,
      interestRate,
      period,
      totalReceivable,
      outstanding,
      recovered: 0,
      arrearsAmount: 0,
      centerId: customer.centerId,
      branchId: customer.branchId,
      supportingDocuments,
    });

    const savedLoan = await loan.save();
    res.status(201).json(savedLoan);
  } catch (error) {
    console.error("Error in createLoan:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get single loan by ID
exports.getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate("customerId productId centerId branchId");
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    res.status(200).json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all loans
exports.getLoans = async (req, res) => {
  try {
    const loans = await Loan.find().populate("customerId productId centerId branchId");
    res.status(200).json(loans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update loan
exports.updateLoan = async (req, res) => {
  try {
    const loan = await Loan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    res.status(200).json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete loan
exports.deleteLoan = async (req, res) => {
  try {
    const loan = await Loan.findByIdAndDelete(req.params.id);
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    res.status(204).json({ message: "Loan deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

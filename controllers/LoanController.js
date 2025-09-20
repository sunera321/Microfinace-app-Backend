/**
 * LOAN CONTROLLER
 * 
 * HTTP request/response handler for loan management operations.
 * Uses LoanService for complex business logic and calculations.
 * Handles document uploads, arrears calculations, and holiday adjustments.
 */

const LoanService = require("../services/loanService");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

/**
 * CLOUDINARY FILE UPLOAD CONFIGURATION
 * Handles loan document uploads to cloud storage
 */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "LoanDocuments",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });

// Configure multi-file upload for loan documents
exports.uploadLoanDocuments = upload.fields([
  { name: "loanApplication", maxCount: 1 },    // Main loan application form
  { name: "clientNIC", maxCount: 1 },          // Client's National ID Card
  { name: "guarantorNIC1", maxCount: 1 },      // First guarantor's NIC
  { name: "guarantorNIC2", maxCount: 1 },      // Second guarantor's NIC
  { name: "otherProof", maxCount: 1 },         // Additional supporting documents
]);

/**
 * CALCULATE BASIC ARREARS AMOUNT
 * Determines overdue payment amount without holiday adjustments
 * @param {Object} loan - Loan object with payment details
 * @param {Object} product - Product object with repayment terms
 * @returns {Number} Arrears amount in currency units
 */
const calculateArrearsAmount = (loan, product) => {
  const { firstDueDate, totalReceivable, recovered, period } = loan;
  const { type } = product;

  const currentDate = new Date();
  const loanStartDate = new Date(firstDueDate);

  // Calculate days elapsed since first payment was due
  const timeDiff = currentDate.getTime() - loanStartDate.getTime();
  const daysPassed = Math.floor(timeDiff / (1000 * 3600 * 24));

  // No arrears if loan hasn't started or is current
  if (daysPassed <= 0) return 0;

  let expectedRecovered = 0;
  const installmentAmount = totalReceivable / period;

  // Calculate expected recovery based on payment frequency
  switch (type?.toLowerCase()) {
    case "daily":
      expectedRecovered = Math.min(daysPassed * installmentAmount, totalReceivable);
      break;
    case "weekly":
      const weeksPassed = Math.floor(daysPassed / 7);
      expectedRecovered = Math.min(weeksPassed * installmentAmount, totalReceivable);
      break;
    case "monthly":
      const monthsPassed = Math.floor(daysPassed / 30);
      expectedRecovered = Math.min(monthsPassed * installmentAmount, totalReceivable);
      break;
    default:
      expectedRecovered = 0;
  }

  // Return arrears as difference between expected and actual payments
  return Math.max(expectedRecovered - (recovered || 0), 0);
};

/**
 * CALCULATE ARREARS WITH HOLIDAY ADJUSTMENTS
 * Advanced arrears calculation that excludes holiday periods for daily loans
 * @param {Object} loan - Loan object with payment details
 * @param {Object} product - Product object with repayment terms
 * @returns {Number} Holiday-adjusted arrears amount
 */
const calculateArrearsAmountWithHolidays = async (loan, product) => {
  const basic = calculateArrearsAmount(loan, product);

  if (product?.type?.toLowerCase() !== "daily") {
    return basic;
  }

  try {
    const firstDueDate = new Date(loan.firstDueDate);
    const now = new Date();

    // No arrears if current date is before first due date
    if (now < firstDueDate) {
      return 0;
    }

    // Count holidays within the loan period for this center/product
    const holidayCount = await Holiday.countDocuments({
      centerId: loan.centerId,
      productId: loan.productId,
      isActive: true,
      date: { $gte: firstDueDate, $lte: now },
    });

    if (holidayCount <= 0) return basic;

    // Adjust calculation by excluding holiday days
    const totalDays = Math.floor((now.getTime() - firstDueDate.getTime()) / (1000 * 3600 * 24));
    const businessDays = Math.max(totalDays - holidayCount, 0);

    const installmentAmount = loan.totalReceivable / loan.period;
    const expectedRecovered = Math.min(businessDays * installmentAmount, loan.totalReceivable);
    const arrearsAmount = Math.max(expectedRecovered - (loan.recovered || 0), 0);
    return arrearsAmount;
  } catch (err) {
    console.error("Error adjusting arrears for holidays:", err);
    return basic;
  }
};

/**
 * CREATE LOAN
 * Process new loan application with document charges and payment calculations
 * @param {Object} req.body - Loan data (customerId, productId, grantedAmount, grantedDate)
 * @returns {Object} 201 - Created loan object
 * @returns {Object} 400/404 - Validation or not found errors
 */
exports.createLoan = async (req, res) => {
  try {
    const { customerId, productId, grantedAmount, grantedDate } = req.body;

    // Validate and parse granted date
    const parsedGrantedDate = new Date(grantedDate);
    if (isNaN(parsedGrantedDate.getTime())) {
      return res.status(400).json({ message: "Invalid granted date" });
    }

    // Verify customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    // Verify product exists and get loan terms
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Extract product terms for loan calculations
    const interestRate = product.interest;           // Annual interest rate percentage
    const period = product.terms;                    // Loan term in payment periods
    const type = product.type?.toLowerCase();        // Payment frequency: daily/weekly/monthly
    const gracePeriod = parseInt(product.Grace_period || 0, 10);  // Days before first payment

    // Calculate loan financial details
    const documentCharges = product.docCharges;      // Document processing fee percentage
    const totalReceivable = parseFloat(grantedAmount) + (parseFloat(grantedAmount) * (interestRate / 100));
    const outstanding = totalReceivable;             // Initial outstanding equals total
    const installmentAmount = totalReceivable / period;  // Per-payment amount
    const loanId = "LN" + Date.now();               // Generate unique loan ID

    // Calculate first payment due date (granted date + grace period)
    const firstDueDate = new Date(parsedGrantedDate.getTime() + gracePeriod * 24 * 60 * 60 * 1000);

    // Calculate document charge amount as percentage of loan
    const documentChargeAmount = parseFloat(grantedAmount) * (documentCharges / 100);

    // Calculate initial arrears (should be 0 for new loans)
    const recovered = 0;
    const tempLoanForArrears = {
      loanId,
      grantedDate: parsedGrantedDate,
      firstDueDate,
      totalReceivable,
      period,
      recovered,
      centerId: customer.centerId,
      productId,
    };
    const arrearsAmount = await calculateArrearsAmountWithHolidays(tempLoanForArrears, product);

    // Handle uploaded supporting documents
    const supportingDocuments = {
      loanApplication: req.files?.loanApplication?.[0]?.path || "",
      clientNIC: req.files?.clientNIC?.[0]?.path || "",
      guarantorNIC1: req.files?.guarantorNIC1?.[0]?.path || "",
      guarantorNIC2: req.files?.guarantorNIC2?.[0]?.path || "",
      otherProof: req.files?.otherProof?.[0]?.path || "",
    };

    // Create new loan record
    const loan = new Loan({
      loanId,
      customerId,
      productId,
      grantedAmount,
      grantedDate: parsedGrantedDate,
      firstDueDate,
      documentCharges,
      documentChargeAmount,      // Store calculated document charge amount
      interestRate,
      period,
      totalReceivable,
      outstanding,
      recovered,
      arrearsAmount,
      centerId: customer.centerId,
      branchId: customer.branchId,
      supportingDocuments,
    });

    const savedLoan = await loan.save();
    res.status(201).json(savedLoan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET LOAN BY ID
 * Retrieve specific loan with updated arrears calculation
 * @param {String} req.params.id - Loan ID
 * @returns {Object} 200 - Loan object with current arrears
 * @returns {Object} 404 - Loan not found
 * @returns {Object} 500 - Server error
 */
exports.getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate("customerId productId centerId branchId");
    if (!loan) return res.status(404).json({ message: "Loan not found" });

    // Calculate and update current arrears amount
    const product = await Product.findById(loan.productId);
    if (product) {
      const currentArrearsAmount = calculateArrearsAmount(loan, product);

      // Update database if arrears amount has changed
      if (loan.arrearsAmount !== currentArrearsAmount) {
        await Loan.findByIdAndUpdate(req.params.id, { arrearsAmount: currentArrearsAmount });
        loan.arrearsAmount = currentArrearsAmount;
      }
    }

    res.status(200).json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET ALL LOANS
 * Retrieve all loans with updated arrears calculations
 * @returns {Array} 200 - List of loans with current financial status
 * @returns {Object} 500 - Server error
 */
exports.getLoans = async (req, res) => {
  try {
    const loans = await Loan.find().populate("customerId productId centerId branchId");

    // Update arrears calculation for each loan
    const loansWithUpdatedArrears = await Promise.all(
      loans.map(async (loan) => {
        try {
          const product = await Product.findById(loan.productId);
          if (product) {
            // Calculate current arrears and outstanding amounts
            const currentArrearsAmount = calculateArrearsAmount(loan, product);
            const currentOutstanding = loan.totalReceivable - (loan.recovered || 0);

            // Update database if amounts have changed
            if (loan.arrearsAmount !== currentArrearsAmount) {
              await Loan.findByIdAndUpdate(loan._id, {
                arrearsAmount: currentArrearsAmount,
                outstanding: currentOutstanding,
              });
              loan.arrearsAmount = currentArrearsAmount;
              loan.outstanding = currentOutstanding;
            }
          }
          return loan;
        } catch (error) {
          console.error("Error updating arrears for loan:", loan.loanId, error);
          return loan;
        }
      })
    );

    res.status(200).json(loansWithUpdatedArrears);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * UPDATE ALL LOANS ARREARS
 * Batch update arrears calculations for all loans (maintenance endpoint)
 * @returns {Object} 200 - Update summary with count of modified loans
 * @returns {Object} 500 - Server error
 */
exports.updateAllLoansArrears = async (req, res) => {
  try {
    const result = await LoanService.updateAllLoansArrears();
    res.status(200).json({
      success: true,
      data: result,
      message: `Updated arrears for ${result.updatedLoans} loans`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * UPDATE LOAN
 * Modify existing loan details
 * @param {String} req.params.id - Loan ID
 * @param {Object} req.body - Updated loan data
 * @returns {Object} 200 - Updated loan object
 * @returns {Object} 404 - Loan not found
 * @returns {Object} 500 - Server error
 */
exports.updateLoan = async (req, res) => {
  try {
    const loan = await LoanService.updateLoan(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: loan,
      message: 'Loan updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * DELETE LOAN
 * Remove loan from system (use with caution)
 * @param {String} req.params.id - Loan ID
 * @returns {Object} 200 - Success message
 * @returns {Object} 404 - Loan not found
 * @returns {Object} 500 - Server error
 */
exports.deleteLoan = async (req, res) => {
  try {
    await LoanService.deleteLoan(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Loan deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

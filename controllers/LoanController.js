const Loan = require("../models/Loan");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Holiday = require("../models/Holiday");
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

// Helper function to calculate arrears amount (legacy - without holidays)
const calculateArrearsAmount = (loan, product) => {
  const { firstDueDate, totalReceivable, recovered, period } = loan;
  const { type } = product;

  const currentDate = new Date();
  const loanStartDate = new Date(firstDueDate); // Use firstDueDate instead of grantedDate

  // Calculate time difference in days
  const timeDiff = currentDate.getTime() - loanStartDate.getTime();
  const daysPassed = Math.floor(timeDiff / (1000 * 3600 * 24));

  // If no days have passed or negative days, no arrears
  if (daysPassed <= 0) return 0;

  let expectedRecovered = 0;
  const installmentAmount = totalReceivable / period;

  switch (type?.toLowerCase()) {
    case "daily":
      // Daily payments - check how many days have passed
      expectedRecovered = Math.min(daysPassed * installmentAmount, totalReceivable);
      break;

    case "weekly":
      // Weekly payments - check how many weeks have passed
      const weeksPassed = Math.floor(daysPassed / 7);
      expectedRecovered = Math.min(weeksPassed * installmentAmount, totalReceivable);
      break;

    case "monthly":
      // Monthly payments - check how many months have passed
      const monthsPassed = Math.floor(daysPassed / 30); // Approximate month as 30 days
      expectedRecovered = Math.min(monthsPassed * installmentAmount, totalReceivable);
      break;

    default:
      expectedRecovered = 0;
  }

  // Calculate arrears - difference between expected recovery and actual recovery
  const arrearsAmount = Math.max(expectedRecovered - (recovered || 0), 0);


  return arrearsAmount;
};

// Helper function to calculate arrears amount considering holidays (daily products)
const calculateArrearsAmountWithHolidays = async (loan, product) => {
  const basic = calculateArrearsAmount(loan, product);

  // Only adjust for daily repayment products
  if (product?.type?.toLowerCase() !== "daily") {
    return basic;
  }

  try {
    const firstDueDate = new Date(loan.firstDueDate); // Use firstDueDate instead of grantedDate
    const now = new Date();

    // If current date is before first due date, no arrears yet
    if (now < firstDueDate) {
      return 0;
    }

    // Count holidays for this center and product within the window
    const holidayCount = await Holiday.countDocuments({
      centerId: loan.centerId,
      productId: loan.productId,
      isActive: true,
      date: { $gte: firstDueDate, $lte: now },
    });

    if (holidayCount <= 0) return basic;

    // Recompute expected with business days = daysPassed - holidayCount
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

// Create Loan
exports.createLoan = async (req, res) => {
  try {
    const { customerId, productId, grantedAmount, grantedDate } = req.body;

    const parsedGrantedDate = new Date(grantedDate);
    if (isNaN(parsedGrantedDate.getTime())) {
      return res.status(400).json({ message: "Invalid granted date" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const interestRate = product.interest;
    const period = product.terms;
    const type = product.type?.toLowerCase(); // 'daily', 'weekly', 'monthly'
    const gracePeriod = parseInt(product.Grace_period || 0, 10);

    const documentCharges = product.docCharges;
    const totalReceivable = parseFloat(grantedAmount) + (parseFloat(grantedAmount) * (interestRate / 100));
    const outstanding = totalReceivable;
    const installmentAmount = totalReceivable / period;
    const loanId = "LN" + Date.now();

    const firstDueDate = new Date(parsedGrantedDate.getTime() + gracePeriod * 24 * 60 * 60 * 1000);

    // Calculate initial arrears (considering holidays for daily products)
    const recovered = 0; // since it's a new loan
    // Temporary loan shape to reuse helper
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
      grantedDate: parsedGrantedDate,
      firstDueDate,
      documentCharges,
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

// Get single loan by ID
exports.getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate("customerId productId centerId branchId");
    if (!loan) return res.status(404).json({ message: "Loan not found" });

    // Get product details for arrears calculation
    const product = await Product.findById(loan.productId);
    if (product) {
      // Calculate current arrears amount
      const currentArrearsAmount = calculateArrearsAmount(loan, product);

      // Update loan with current arrears amount
      if (loan.arrearsAmount !== currentArrearsAmount) {
        await Loan.findByIdAndUpdate(req.params.id, { arrearsAmount: currentArrearsAmount });
        loan.arrearsAmount = currentArrearsAmount;
      }
    }

    res.status(200).json(loan);
  } catch (error) {
    console.error("❌ Error in getLoanById:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all loans
exports.getLoans = async (req, res) => {
  try {
    const loans = await Loan.find().populate("customerId productId centerId branchId");

    // Update arrears for each loan
    const loansWithUpdatedArrears = await Promise.all(
      loans.map(async (loan) => {
        try {
          // Get product details
          const product = await Product.findById(loan.productId);
          if (product) {
            // Calculate current arrears amount
            const currentArrearsAmount = calculateArrearsAmount(loan, product);

            // Update loan with current arrears amount if different
            if (loan.arrearsAmount !== currentArrearsAmount) {
              await Loan.findByIdAndUpdate(loan._id, {
                arrearsAmount: currentArrearsAmount,
                outstanding: loan.totalReceivable - (loan.recovered || 0),
              });
              loan.arrearsAmount = currentArrearsAmount;
              loan.outstanding = loan.totalReceivable - (loan.recovered || 0);
            }
          }
          return loan;
        } catch (error) {
          
          return loan;
        }
      })
    );


    res.status(200).json(loansWithUpdatedArrears);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Optional: Add a dedicated endpoint to update arrears for all loans
exports.updateAllLoansArrears = async (req, res) => {
  try {
    const loans = await Loan.find();
    let updatedCount = 0;

    for (const loan of loans) {
      const product = await Product.findById(loan.productId);
      if (product) {
        const currentArrearsAmount = calculateArrearsAmount(loan, product);
        const currentOutstanding = loan.totalReceivable - (loan.recovered || 0);

        if (loan.arrearsAmount !== currentArrearsAmount || loan.outstanding !== currentOutstanding) {
          await Loan.findByIdAndUpdate(loan._id, {
            arrearsAmount: currentArrearsAmount,
            outstanding: currentOutstanding,
          });
          updatedCount++;
        }
      }
    }

    res.status(200).json({
      message: `Updated arrears for ${updatedCount} loans`,
      totalLoans: loans.length,
      updatedLoans: updatedCount,
    });
  } catch (error) {
    console.error("❌ Error updating all loans arrears:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update loan
exports.updateLoan = async (req, res) => {
  try {
    const loan = await Loan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    console.log("Updated loan:", req.body);
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

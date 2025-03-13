const Loan = require("../models/Loan");
const Product = require("../models/Product");
const Customer = require("../models/Customer");

exports.createLoan = async (req, res) => {
    try {
        const { customerId, productId, grantedAmount } = req.body;

        // Validate customer and product
        const customer = await Customer.findById(customerId);
        if (!customer) return res.status(404).json({ message: "Customer not found" });

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });

        // Loan calculation
        const interestRate = product.interest;
        const period = product.terms;
        const Grace_period = product.Grace_period; 
        const documentCharges = product.docCharges;
        const totalReceivable = grantedAmount + (grantedAmount * (interestRate / 100));
        const outstanding = totalReceivable;

        // Generate unique Loan ID
        const loanId = "LN" + Date.now();

        // Create loan record
        const loan = new Loan({
            loanId,
            customerId,
            productId,
            grantedAmount,
            grantedDate: new Date(),
            firstDueDate: new Date(new Date().setDate(new Date().getDate() + Grace_period)),
            documentCharges,
            interestRate,
            period,
            totalReceivable,
            outstanding,
            centerId: customer.centerId,
            branchId: customer.branchId,
        });

        // Save to database
        const savedLoan = await loan.save();
        res.status(201).json(savedLoan);
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

// Get loan by ID
exports.getLoanById = async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id).populate("customerId productId centerId branchId");
        if (!loan) return res.status(404).json({ message: "Loan not found" });
        res.status(200).json(loan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update loan
exports.updateLoan = async (req, res) => {
    try {
        const loan = await Loan.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("customerId productId centerId branchId");
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

/**
 * REPAYMENT CONTROLLER
 * 
 * HTTP request/response handler for loan repayment operations.
 * Uses RepaymentService for business logic and loan updates.
 */

// Note: RepaymentService not yet implemented, using direct model access temporarily
const Repayment = require("../models/Repayment");
const Loan = require("../models/Loan");

/**
 * Get repayments by loan ID
 * GET /api/repayments/loan/:loanId
 */
exports.getRepaymentsByLoanId = async (req, res) => {
    try {
        const loanId = req.params.loanId;
        const loan = await Loan.findById(loanId);
        if (!loan) {
            return res.status(404).json({
                success: false,
                message: "Loan not found"
            });
        }
        
        const repayments = await Repayment.find({ loanId }).sort({ paidDate: -1 });
        res.status(200).json({
            success: true,
            data: repayments,
            message: 'Repayments retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch repayments"
        });
    }
};

/**
 * Create a new repayment
 * POST /api/repayments
 */
exports.createRepayment = async (req, res) => {
    try {
        const { loanId, amount, remarks } = req.body;

        // Input validation
        if (!loanId || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid repayment input - loanId and positive amount required"
            });
        }

        const loan = await Loan.findById(loanId);
        if (!loan) {
            return res.status(404).json({
                success: false,
                message: "Loan not found"
            });
        }

        // Create repayment record
        const repayment = new Repayment({ loanId, amount, remarks });
        await repayment.save();

        // Update loan amounts
        loan.recovered += amount;
        loan.outstanding = Math.max(0, loan.totalReceivable - loan.recovered);
        loan.arrearsAmount = Math.max(0, loan.outstanding - (loan.grantedAmount - loan.recovered));
        await loan.save();
        console.log("Repayment created:", repayment);
        
        // ✅ Log repayment event (if EventLog is available)
        try {
            const EventLog = require("../models/EventLog");
            await EventLog.create({
                type: "REPAYMENT",
                loanId,
                amount,
                date: new Date(),
                description: `Repayment of ${amount} recorded for loan ${loanId}`,
            });
        } catch (eventLogError) {
            console.log("EventLog not available or failed to log:", eventLogError.message);
        }

        res.status(201).json({
            success: true,
            data: { repayment, updatedLoan: loan },
            message: 'Repayment created successfully'
        });
    } catch (error) {
        console.error("Repayment error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create repayment"
        });
    }
};


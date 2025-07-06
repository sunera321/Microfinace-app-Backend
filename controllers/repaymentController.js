const Repayment = require("../models/Repayment");
const Loan = require("../models/Loan");
const mongoose = require("mongoose");

exports.getRepaymentsByLoanId = async (req, res) => {
    const loanId = req.params.loanId;
  const loan = await Loan.findById(loanId);
    if (!loan) {
        return res.status(404).json({ error: "Loan not found" });
    }
    
  try {
    const repayments = await Repayment.find({ loanId: req.params.loanId }).sort({ paidDate: -1 });
    res.json(repayments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch repayments" });
  }
};

exports.createRepayment = async (req, res) => {
    try {
        const { loanId, amount, remarks } = req.body;

        

        const loan = await Loan.findById(loanId);
        if (!loan) {
            return res.status(404).json({ error: "Loan not found" });
        }
        if (!loanId || !amount || amount <= 0) {
            return res.status(400).json({ error: "Invalid repayment input" });
        }

        const repayment = new Repayment({ loanId, amount, remarks });
        await repayment.save();

        loan.recovered += amount;
        loan.outstanding = Math.max(0, loan.totalReceivable - loan.recovered);
        await loan.save();

        // ✅ Log repayment event
        if (typeof EventLog !== "undefined") {
            await EventLog.create({
                type: "REPAYMENT",
                loanId,
                amount,
                date: new Date(),
                description: `Repayment of ${amount} recorded for loan ${loanId}`,
            });
        }

        res.status(201).json({ repayment, updatedLoan: loan });
    } catch (err) {
        console.error("Repayment error:", err);
        res.status(500).json({ error: "Failed to create repayment" });
    }
};


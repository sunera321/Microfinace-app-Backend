const InterestCalculationService = require('../services/interestCalculationService');
const Loan = require('../models/Loan');
const Holiday = require('../models/Holiday');

// Calculate interest for a specific loan considering holidays
exports.calculateInterest = async (req, res) => {
    try {
        const { loanId, startDate, endDate } = req.body;

        if (!loanId || !startDate || !endDate) {
            return res.status(400).json({ 
                message: "loanId, startDate, and endDate are required" 
            });
        }

        const result = await InterestCalculationService.calculateInterestWithHolidays(
            loanId, 
            new Date(startDate), 
            new Date(endDate)
        );

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Calculate interest for multiple loans
exports.calculateInterestForMultipleLoans = async (req, res) => {
    try {
        const { loanIds, startDate, endDate } = req.body;

        if (!loanIds || !Array.isArray(loanIds) || !startDate || !endDate) {
            return res.status(400).json({ 
                message: "loanIds (array), startDate, and endDate are required" 
            });
        }

        const results = await InterestCalculationService.calculateInterestForMultipleLoans(
            loanIds, 
            new Date(startDate), 
            new Date(endDate)
        );

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Check if a specific date is a holiday for a center and product
exports.checkHoliday = async (req, res) => {
    try {
        const { centerId, productId, date } = req.params;

        if (!centerId || !productId || !date) {
            return res.status(400).json({ 
                message: "centerId, productId, and date are required" 
            });
        }

        const isHoliday = await InterestCalculationService.isHoliday(centerId, productId, new Date(date));
        
        res.status(200).json({ 
            centerId, 
            productId,
            date, 
            isHoliday 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get holidays for a center and product within a date range
exports.getHolidaysInRange = async (req, res) => {
    try {
        const { centerId, productId } = req.params;
        const { startDate, endDate } = req.query;

        if (!centerId || !productId || !startDate || !endDate) {
            return res.status(400).json({ 
                message: "centerId, productId, startDate, and endDate are required" 
            });
        }

        const holidays = await InterestCalculationService.getHolidaysInRange(
            centerId, 
            productId,
            new Date(startDate), 
            new Date(endDate)
        );

        res.status(200).json(holidays);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Calculate interest for all loans in a center
exports.calculateInterestForCenter = async (req, res) => {
    try {
        const { centerId } = req.params;
        const { startDate, endDate } = req.query;

        if (!centerId || !startDate || !endDate) {
            return res.status(400).json({ 
                message: "centerId, startDate, and endDate are required" 
            });
        }

        // Get all loans for the center
        const loans = await Loan.find({ centerId, isActive: true });
        const loanIds = loans.map(loan => loan._id);

        if (loanIds.length === 0) {
            return res.status(200).json({ 
                message: "No loans found for this center",
                results: [] 
            });
        }

        const results = await InterestCalculationService.calculateInterestForMultipleLoans(
            loanIds, 
            new Date(startDate), 
            new Date(endDate)
        );

        res.status(200).json({
            centerId,
            startDate,
            endDate,
            totalLoans: loanIds.length,
            results
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 
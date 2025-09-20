/**
 * INTEREST CONTROLLER
 * 
 * HTTP request/response handler for interest calculation operations.
 * Uses InterestCalculationService for complex financial calculations.
 */

const InterestCalculationService = require('../services/interestCalculationService');

/**
 * Calculate interest for a specific loan considering holidays
 * POST /api/interest/calculate
 */
exports.calculateInterest = async (req, res) => {
    try {
        const { loanId, startDate, endDate } = req.body;

        if (!loanId || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "loanId, startDate, and endDate are required"
            });
        }

        const result = await InterestCalculationService.calculateInterestWithHolidays(
            loanId, 
            new Date(startDate), 
            new Date(endDate)
        );

        res.status(200).json({
            success: true,
            data: result,
            message: 'Interest calculated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Calculate interest for multiple loans
 * POST /api/interest/calculate-multiple
 */
exports.calculateInterestForMultipleLoans = async (req, res) => {
    try {
        const { loanIds, startDate, endDate } = req.body;

        if (!loanIds || !Array.isArray(loanIds) || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "loanIds (array), startDate, and endDate are required"
            });
        }

        const results = await InterestCalculationService.calculateInterestForMultipleLoans(
            new Date(startDate), 
            new Date(endDate)
        );

        res.status(200).json({
            success: true,
            data: results,
            message: 'Interest calculated successfully for multiple loans'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Check if a specific date is a holiday for a center and product
 * GET /api/interest/check-holiday/:centerId/:productId/:date
 */
exports.checkHoliday = async (req, res) => {
    try {
        const { centerId, productId, date } = req.params;

        if (!centerId || !productId || !date) {
            return res.status(400).json({
                success: false,
                message: "centerId, productId, and date are required"
            });
        }

        const isHoliday = await InterestCalculationService.isHoliday(centerId, productId, new Date(date));
        
        res.status(200).json({
            success: true,
            data: { centerId, productId, date, isHoliday },
            message: 'Holiday check completed'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get holidays for a center and product within a date range
 * GET /api/interest/holidays/:centerId/:productId
 */
exports.getHolidaysInRange = async (req, res) => {
    try {
        const { centerId, productId } = req.params;
        const { startDate, endDate } = req.query;

        if (!centerId || !productId || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "centerId, productId, startDate, and endDate are required"
            });
        }

        const holidays = await InterestCalculationService.getHolidaysInRange(
            centerId, 
            productId,
            new Date(startDate), 
            new Date(endDate)
        );

        res.status(200).json({
            success: true,
            data: holidays,
            message: 'Holidays retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Calculate interest for all loans in a center
 * POST /api/interest/center/:centerId
 */
exports.calculateInterestForCenter = async (req, res) => {
    try {
        const { centerId } = req.params;
        const { startDate, endDate } = req.query;

        if (!centerId || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "centerId, startDate, and endDate are required"
            });
        }

        // Get all loans for the center (using InterestCalculationService indirectly)
        const Loan = require('../models/Loan');
        const loans = await Loan.find({ centerId, isActive: true });
        const loanIds = loans.map(loan => loan._id);

        if (loanIds.length === 0) {
            return res.status(200).json({
                success: true,
                data: { results: [] },
                message: "No loans found for this center"
            });
        }

        const results = await InterestCalculationService.calculateInterestForMultipleLoans(
            loanIds, 
            new Date(startDate), 
            new Date(endDate)
        );

        res.status(200).json({
            success: true,
            data: {
                centerId,
                startDate,
                endDate,
                totalLoans: loanIds.length,
                results
            },
            message: 'Interest calculated successfully for center'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 
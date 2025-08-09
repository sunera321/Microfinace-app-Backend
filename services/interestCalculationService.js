const Loan = require('../models/Loan');
const Holiday = require('../models/Holiday');

class InterestCalculationService {
    
    /**
     * Calculate interest for a single loan considering holidays
     * @param {string} loanId - The loan ID
     * @param {Date} startDate - Start date for interest calculation (optional, defaults to firstDueDate)
     * @param {Date} endDate - End date for interest calculation
     * @returns {Object} Interest calculation result
     */
    static async calculateInterestWithHolidays(loanId, startDate, endDate) {
        try {
            // Find the loan
            const loan = await Loan.findOne({ loanId }).populate('centerId productId');
            if (!loan) {
                throw new Error(`Loan with ID ${loanId} not found`);
            }

            // Use firstDueDate as default start if not provided, or if startDate is before firstDueDate
            const effectiveStartDate = !startDate || startDate < loan.firstDueDate 
                ? loan.firstDueDate 
                : startDate;

            // If effective start date is after end date, no interest accrued
            if (effectiveStartDate >= endDate) {
                return {
                    loanId: loan.loanId,
                    principalAmount: loan.outstanding,
                    interestRate: loan.interestRate,
                    startDate: effectiveStartDate,
                    endDate,
                    totalDays: 0,
                    holidayDays: 0,
                    businessDays: 0,
                    dailyInterestRate: loan.interestRate / 100 / 365,
                    interestAmount: 0,
                    holidays: []
                };
            }

            // Get holidays in the date range for this loan's center and product
            const holidays = await this.getHolidaysInRange(
                loan.centerId._id, 
                loan.productId._id, 
                effectiveStartDate, 
                endDate
            );

            // Calculate business days (excluding holidays)
            const totalDays = this.calculateDaysBetween(effectiveStartDate, endDate);
            const holidayDays = holidays.length;
            const businessDays = totalDays - holidayDays;

            // Calculate interest
            const dailyInterestRate = loan.interestRate / 100 / 365; // Convert annual rate to daily
            const principalAmount = loan.outstanding;
            const interestAmount = principalAmount * dailyInterestRate * businessDays;

            return {
                loanId: loan.loanId,
                principalAmount,
                interestRate: loan.interestRate,
                startDate: effectiveStartDate,
                endDate,
                totalDays,
                holidayDays,
                businessDays,
                dailyInterestRate,
                interestAmount: Math.round(interestAmount * 100) / 100, // Round to 2 decimal places
                holidays: holidays.map(h => ({
                    name: h.name,
                    date: h.date,
                    description: h.description
                }))
            };
        } catch (error) {
            throw new Error(`Error calculating interest: ${error.message}`);
        }
    }

    /**
     * Calculate interest for multiple loans
     * @param {Array} loanIds - Array of loan IDs
     * @param {Date} startDate - Start date for interest calculation
     * @param {Date} endDate - End date for interest calculation
     * @returns {Array} Array of interest calculation results
     */
    static async calculateInterestForMultipleLoans(loanIds, startDate, endDate) {
        try {
            const results = [];
            
            for (const loanId of loanIds) {
                try {
                    const result = await this.calculateInterestWithHolidays(loanId, startDate, endDate);
                    results.push(result);
                } catch (error) {
                    results.push({
                        loanId,
                        error: error.message
                    });
                }
            }

            return results;
        } catch (error) {
            throw new Error(`Error calculating interest for multiple loans: ${error.message}`);
        }
    }

    /**
     * Check if a specific date is a holiday for a center and product
     * @param {string} centerId - Center ID
     * @param {string} productId - Product ID  
     * @param {Date} date - Date to check
     * @returns {boolean} True if the date is a holiday
     */
    static async isHoliday(centerId, productId, date) {
        try {
            const holiday = await Holiday.findOne({
                centerId,
                productId,
                date: {
                    $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                    $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
                },
                isActive: true
            });

            return !!holiday;
        } catch (error) {
            throw new Error(`Error checking holiday: ${error.message}`);
        }
    }

    /**
     * Get all holidays in a date range for a center and product
     * @param {string} centerId - Center ID
     * @param {string} productId - Product ID
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Array} Array of holidays
     */
    static async getHolidaysInRange(centerId, productId, startDate, endDate) {
        try {
            const holidays = await Holiday.find({
                centerId,
                productId,
                date: {
                    $gte: startDate,
                    $lte: endDate
                },
                isActive: true
            }).sort({ date: 1 });

            return holidays;
        } catch (error) {
            throw new Error(`Error getting holidays: ${error.message}`);
        }
    }

    /**
     * Calculate the number of days between two dates
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {number} Number of days
     */
    static calculateDaysBetween(startDate, endDate) {
        const timeDifference = endDate.getTime() - startDate.getTime();
        const dayDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
        return dayDifference;
    }

    /**
     * Calculate compound interest
     * @param {number} principal - Principal amount
     * @param {number} rate - Annual interest rate (as percentage)
     * @param {number} time - Time in years
     * @param {number} compoundFrequency - How many times interest is compounded per year
     * @returns {number} Compound interest amount
     */
    static calculateCompoundInterest(principal, rate, time, compoundFrequency = 1) {
        const amount = principal * Math.pow((1 + (rate / 100) / compoundFrequency), compoundFrequency * time);
        return amount - principal;
    }

    /**
     * Calculate simple interest
     * @param {number} principal - Principal amount
     * @param {number} rate - Annual interest rate (as percentage)
     * @param {number} time - Time in years
     * @returns {number} Simple interest amount
     */
    static calculateSimpleInterest(principal, rate, time) {
        return (principal * rate * time) / 100;
    }
}

module.exports = InterestCalculationService;
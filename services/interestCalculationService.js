/**
 * INTEREST CALCULATION SERVICE
 * 
 * Provides sophisticated interest calculation functionality for microfinance loans.
 * Handles complex scenarios including:
 * - Holiday exclusions for daily payment products
 * - Compound interest calculations
 * - Business day adjustments
 * - Multi-loan batch processing
 * 
 * This service ensures accurate financial calculations that comply with
 * microfinance industry standards and regulatory requirements.
 */

const Loan = require('../models/Loan');
const Holiday = require('../models/Holiday');

class InterestCalculationService {
    
    /**
     * CALCULATE INTEREST WITH HOLIDAY ADJUSTMENTS
     * 
     * Computes interest for a loan while excluding designated holiday periods.
     * This is essential for daily payment products where holidays affect payment schedules.
     * 
     * @param {string} loanId - Unique loan identifier
     * @param {Date} startDate - Interest calculation start date (optional, defaults to firstDueDate)
     * @param {Date} endDate - Interest calculation end date
     * @returns {Object} Detailed interest calculation with holiday adjustments
     * 
     * Returns object contains:
     * - principalAmount: Outstanding loan balance
     * - interestRate: Annual percentage rate
     * - totalDays: Calendar days in calculation period
     * - holidayDays: Number of holidays excluded
     * - businessDays: Actual days for interest calculation
     * - interestAmount: Final calculated interest
     * - holidays: List of holidays found in period
     */
    static async calculateInterestWithHolidays(loanId, startDate, endDate) {
        try {
            // Retrieve loan with center and product details for holiday calculation
            const loan = await Loan.findOne({ loanId }).populate('centerId productId');
            if (!loan) {
                throw new Error(`Loan with ID ${loanId} not found`);
            }

            // Ensure start date is not before loan's first due date
            const effectiveStartDate = !startDate || startDate < loan.firstDueDate 
                ? loan.firstDueDate 
                : startDate;

            // Handle invalid date range
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

            const totalDays = this.calculateDaysBetween(effectiveStartDate, endDate);
            const dailyInterestRate = loan.interestRate / 100 / 365;
            const principalAmount = loan.outstanding;
            
            let holidayDays = 0;
            let businessDays = totalDays;
            let holidays = [];

            // Only apply holiday adjustments for daily loans
            if (loan.productId?.type?.toLowerCase() === "daily") {
                // Find holidays that affect this loan's payment schedule
                holidays = await this.getHolidaysInRange(
                    loan.centerId._id, 
                    loan.productId._id, 
                    effectiveStartDate, 
                    endDate
                );
                
                // Calculate business days (total days minus holidays) for daily loans
                holidayDays = holidays.length;
                businessDays = totalDays - holidayDays;
            }
            // For weekly/monthly loans, use total days (ignore holidays)

            // Perform interest calculation
            const interestAmount = principalAmount * dailyInterestRate * businessDays;

            return {
                loanId: loan.loanId,
                principalAmount,
                interestRate: loan.interestRate,
                productType: loan.productId?.type || 'unknown',
                startDate: effectiveStartDate,
                endDate,
                totalDays,
                holidayDays,
                businessDays,
                dailyInterestRate,
                interestAmount: Math.round(interestAmount * 100) / 100,  // Round to 2 decimal places
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
     * BATCH INTEREST CALCULATION
     * 
     * Processes interest calculations for multiple loans simultaneously.
     * Useful for end-of-day processing or bulk reporting operations.
     * 
     * @param {Array} loanIds - Array of loan identifiers to process
     * @param {Date} startDate - Common start date for all calculations
     * @param {Date} endDate - Common end date for all calculations
     * @returns {Array} Array of calculation results (includes errors for failed loans)
     */
    static async calculateInterestForMultipleLoans(loanIds, startDate, endDate) {
        try {
            const results = [];
            
            // Process each loan individually to prevent one failure from stopping the batch
            for (const loanId of loanIds) {
                try {
                    const result = await this.calculateInterestWithHolidays(loanId, startDate, endDate);
                    results.push(result);
                } catch (error) {
                    // Include failed calculations in results for reporting
                    results.push({
                        loanId,
                        error: error.message,
                        success: false
                    });
                }
            }

            return results;
        } catch (error) {
            throw new Error(`Error calculating interest for multiple loans: ${error.message}`);
        }
    }

    /**
     * HOLIDAY VALIDATION
     * 
     * Checks if a specific date is designated as a holiday for a given center and product.
     * Used to validate payment schedules and interest calculations.
     * 
     * @param {string} centerId - Center identifier
     * @param {string} productId - Product identifier
     * @param {Date} date - Date to check for holiday status
     * @returns {boolean} True if date is a holiday, false otherwise
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
     * GET HOLIDAYS IN DATE RANGE
     * 
     * Retrieves all active holidays within a specified period for a center and product.
     * Essential for accurate interest and payment calculations.
     * 
     * @param {string} centerId - Center identifier
     * @param {string} productId - Product identifier  
     * @param {Date} startDate - Range start date
     * @param {Date} endDate - Range end date
     * @returns {Array} Ordered array of holiday records
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
            }).sort({ date: 1 });           // Sort chronologically for processing

            return holidays;
        } catch (error) {
            throw new Error(`Error getting holidays: ${error.message}`);
        }
    }

    /**
     * CALCULATE DAYS BETWEEN DATES
     * 
     * Utility function to determine the number of days between two dates.
     * Used for interest calculations and payment scheduling.
     * 
     * @param {Date} startDate - Beginning date
     * @param {Date} endDate - Ending date
     * @returns {number} Number of days between dates (inclusive)
     */
    static calculateDaysBetween(startDate, endDate) {
        const timeDifference = endDate.getTime() - startDate.getTime();
        const dayDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
        return dayDifference;
    }

    /**
     * COMPOUND INTEREST CALCULATION
     * 
     * Calculates compound interest using the standard formula.
     * Useful for long-term loans or investment products.
     * 
     * @param {number} principal - Principal loan amount
     * @param {number} rate - Annual interest rate (as percentage)
     * @param {number} time - Time period in years
     * @param {number} compoundFrequency - Compounding frequency per year (default: 1)
     * @returns {number} Compound interest amount (not including principal)
     */
    static calculateCompoundInterest(principal, rate, time, compoundFrequency = 1) {
        const amount = principal * Math.pow((1 + (rate / 100) / compoundFrequency), compoundFrequency * time);
        return amount - principal;
    }

    /**
     * SIMPLE INTEREST CALCULATION
     * 
     * Calculates simple interest using the basic formula.
     * Commonly used for short-term microfinance products.
     * 
     * @param {number} principal - Principal loan amount
     * @param {number} rate - Annual interest rate (as percentage)
     * @param {number} time - Time period in years
     * @returns {number} Simple interest amount
     */
    static calculateSimpleInterest(principal, rate, time) {
        return (principal * rate * time) / 100;
    }
}

module.exports = InterestCalculationService;
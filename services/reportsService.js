const Loan = require("../models/Loan");
const Customer = require("../models/Customer");
const Center = require("../models/Center");
const Repayment = require("../models/Repayment");

class ReportsService {
    static async getOverviewReport() {
        try {
            const totalLoans = await Loan.countDocuments();
            const totalCustomers = await Customer.countDocuments();
            const totalCenters = await Center.countDocuments();
            const activeLoans = await Loan.countDocuments({ outstanding: { $gt: 0 } });
            
            return {
                success: true,
                data: {
                    totalLoans,
                    activeLoans,
                    totalCustomers,
                    totalCenters
                }
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    static async getLoanReport() {
        try {
            const loans = await Loan.find()

            return {
                success: true,
                data: { loans }
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    static async getCollectionReport() {
        try {
            const repayments = await Repayment.find()

            return {
                success: true,
                data: { repayments }
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    static async getAllReports() {
        try {
            const overview = await this.getOverviewReport();
            const loans = await this.getLoanReport();
            const collections = await this.getCollectionReport();
            
            return {
                success: true,
                data: {
                    overview: overview.data,
                    loans: loans.data,
                    collections: collections.data
                }
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Get Today's Collection Data
    static async getTodayCollections() {
        try {
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

            const todayRepayments = await Repayment.find({
                paidDate: {
                    $gte: startOfDay,
                    $lt: endOfDay
                }
            }).populate('loanId', 'customerId principal outstanding');

            const totalAmount = todayRepayments.reduce((sum, repayment) => sum + (repayment.amount || 0), 0);
            const totalTransactions = todayRepayments.length;

            return {
                success: true,
                data: {
                    date: startOfDay.toISOString().split('T')[0],
                    totalAmount,
                    totalTransactions,
                    repayments: todayRepayments
                }
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Get Weekly Collection Data
    static async getWeeklyCollections() {
        try {
            const today = new Date();
            const currentDay = today.getDay(); 
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - currentDay); 
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);

            const weeklyRepayments = await Repayment.find({
                paidDate: {
                    $gte: startOfWeek,
                    $lt: endOfWeek
                }
            }).populate('loanId', 'customerId principal outstanding');

            // Group by day of week
            const dailyData = {};
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            
            // Initialize all days with zero values
            dayNames.forEach((day, index) => {
                const dayDate = new Date(startOfWeek);
                dayDate.setDate(startOfWeek.getDate() + index);
                dailyData[day] = {
                    date: dayDate.toISOString().split('T')[0],
                    totalAmount: 0,
                    totalTransactions: 0,
                    repayments: []
                };
            });

            // Fill in actual data
            weeklyRepayments.forEach(repayment => {
                const repaymentDate = new Date(repayment.paidDate);
                const dayName = dayNames[repaymentDate.getDay()];
                dailyData[dayName].totalAmount += repayment.amount || 0;
                dailyData[dayName].totalTransactions += 1;
                dailyData[dayName].repayments.push(repayment);
            });

            const totalWeeklyAmount = weeklyRepayments.reduce((sum, repayment) => sum + (repayment.amount || 0), 0);
            const totalWeeklyTransactions = weeklyRepayments.length;

            return {
                success: true,
                data: {
                    weekStart: startOfWeek.toISOString().split('T')[0],
                    weekEnd: new Date(endOfWeek.getTime() - 1).toISOString().split('T')[0],
                    totalWeeklyAmount,
                    totalWeeklyTransactions,
                    dailyBreakdown: dailyData,
                    allRepayments: weeklyRepayments
                }
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Get Monthly Collection Data
    static async getMonthlyCollections() {
        try {
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            
            const startOfMonth = new Date(currentYear, currentMonth, 1);
            const endOfMonth = new Date(currentYear, currentMonth + 1, 1);

            const monthlyRepayments = await Repayment.find({
                paidDate: {
                    $gte: startOfMonth,
                    $lt: endOfMonth
                }
            }).populate('loanId', 'customerId principal outstanding');

            // Group by weeks in the month
            const weeklyData = {};
            const totalWeeks = Math.ceil(new Date(currentYear, currentMonth + 1, 0).getDate() / 7);
            
            for (let week = 1; week <= totalWeeks; week++) {
                const weekStart = new Date(currentYear, currentMonth, (week - 1) * 7 + 1);
                const weekEnd = new Date(currentYear, currentMonth, week * 7);
                if (weekEnd > endOfMonth) weekEnd.setTime(endOfMonth.getTime() - 1);
                
                weeklyData[`Week ${week}`] = {
                    weekStart: weekStart.toISOString().split('T')[0],
                    weekEnd: weekEnd.toISOString().split('T')[0],
                    totalAmount: 0,
                    totalTransactions: 0,
                    repayments: []
                };
            }

            // Fill in actual data
            monthlyRepayments.forEach(repayment => {
                const repaymentDate = new Date(repayment.paidDate);
                const dayOfMonth = repaymentDate.getDate();
                const weekNumber = Math.ceil(dayOfMonth / 7);
                const weekKey = `Week ${weekNumber}`;
                
                if (weeklyData[weekKey]) {
                    weeklyData[weekKey].totalAmount += repayment.amount || 0;
                    weeklyData[weekKey].totalTransactions += 1;
                    weeklyData[weekKey].repayments.push(repayment);
                }
            });

            const totalMonthlyAmount = monthlyRepayments.reduce((sum, repayment) => sum + (repayment.amount || 0), 0);
            const totalMonthlyTransactions = monthlyRepayments.length;

            return {
                success: true,
                data: {
                    month: startOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                    monthStart: startOfMonth.toISOString().split('T')[0],
                    monthEnd: new Date(endOfMonth.getTime() - 1).toISOString().split('T')[0],
                    totalMonthlyAmount,
                    totalMonthlyTransactions,
                    weeklyBreakdown: weeklyData,
                    allRepayments: monthlyRepayments
                }
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Get Collection Summary (Today + Weekly + Monthly)
    static async getCollectionSummary() {
        try {
            const today = await this.getTodayCollections();
            const weekly = await this.getWeeklyCollections();
            const monthly = await this.getMonthlyCollections();

            return {
                success: true,
                data: {
                    today: today.data,
                    weekly: weekly.data,
                    monthly: monthly.data
                }
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

module.exports = ReportsService;

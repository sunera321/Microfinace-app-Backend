const Loan = require("../models/Loan");
const Customer = require("../models/Customer");
const Center = require("../models/Center");
const Branch = require("../models/Branch");
const Repayment = require("../models/Repayment");
const Product = require("../models/Product");

class ReportsService {
    /**
     * Get overview report data
     * @returns {Promise<Object>} Overview report data
     */
    static async getOverviewReport() {
        // Get total loans count
        const totalLoans = await Loan.countDocuments();
        
        // Get total portfolio amount using aggregation
        const portfolioData = await Loan.aggregate([
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$grantedAmount" },
                    totalReceivable: { $sum: "$totalReceivable" },
                    totalRecovered: { $sum: "$recovered" },
                    totalOutstanding: { $sum: "$outstanding" },
                    totalArrears: { $sum: "$arrearsAmount" }
                }
            }
        ]);

        // Get loan counts by status
        const activeLoans = await Loan.countDocuments({ outstanding: { $gt: 0 } });
        const completedLoans = await Loan.countDocuments({ outstanding: 0 });
        
        // Get total customers and centers
        const totalCustomers = await Customer.countDocuments();
        const totalCenters = await Center.countDocuments();
        const totalBranches = await Branch.countDocuments();

        // Calculate collection rate
        const portfolio = portfolioData[0] || { 
            totalAmount: 0, 
            totalReceivable: 0, 
            totalRecovered: 0, 
            totalOutstanding: 0,
            totalArrears: 0
        };
        
        const collectionRate = portfolio.totalReceivable > 0 
            ? ((portfolio.totalRecovered / portfolio.totalReceivable) * 100).toFixed(1)
            : 0;
        
        // Calculate portfolio at risk (loans with arrears > 0)
        const loansWithArrears = await Loan.countDocuments({ arrearsAmount: { $gt: 0 } });
        const portfolioAtRisk = totalLoans > 0 
            ? ((loansWithArrears / totalLoans) * 100).toFixed(1)
            : 0;

        return {
            totalLoans,
            activeLoans,
            completedLoans,
            totalCustomers,
            totalCenters,
            totalBranches,
            portfolio: {
                totalAmount: portfolio.totalAmount,
                totalReceivable: portfolio.totalReceivable,
                totalRecovered: portfolio.totalRecovered,
                totalOutstanding: portfolio.totalOutstanding,
                totalArrears: portfolio.totalArrears
            },
            metrics: {
                collectionRate: parseFloat(collectionRate),
                portfolioAtRisk: parseFloat(portfolioAtRisk),
                averageLoanSize: totalLoans > 0 ? (portfolio.totalAmount / totalLoans).toFixed(2) : 0
            }
        };
    }

    /**
     * Get loan report data
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} Loan report data
     */
    static async getLoanReport(filters = {}) {
        let matchStage = {};

        // Apply date filters
        if (filters.startDate || filters.endDate) {
            matchStage.grantedDate = {};
            if (filters.startDate) {
                matchStage.grantedDate.$gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                matchStage.grantedDate.$lte = new Date(filters.endDate);
            }
        }

        // Apply branch filter
        if (filters.branchId) {
            matchStage.branchId = filters.branchId;
        }

        // Apply center filter
        if (filters.centerId) {
            matchStage.centerId = filters.centerId;
        }

        // Apply product filter
        if (filters.productId) {
            matchStage.productId = filters.productId;
        }

        // Get detailed loan data
        const loanDetails = await Loan.find(matchStage)
            .populate('customerId', 'firstName lastName email NIC_no')
            .populate('productId', 'name type interest')
            .populate('centerId', 'name')
            .populate('branchId', 'name')
            .sort({ grantedDate: -1 });

        // Get aggregated data
        const aggregationPipeline = [
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalLoans: { $sum: 1 },
                    totalAmount: { $sum: "$grantedAmount" },
                    totalReceivable: { $sum: "$totalReceivable" },
                    totalRecovered: { $sum: "$recovered" },
                    totalOutstanding: { $sum: "$outstanding" },
                    totalArrears: { $sum: "$arrearsAmount" },
                    avgLoanSize: { $avg: "$grantedAmount" },
                    activeLoans: {
                        $sum: {
                            $cond: [{ $gt: ["$outstanding", 0] }, 1, 0]
                        }
                    },
                    overdueLoans: {
                        $sum: {
                            $cond: [{ $gt: ["$arrearsAmount", 0] }, 1, 0]
                        }
                    }
                }
            }
        ];

        const aggregationResult = await Loan.aggregate(aggregationPipeline);
        const summary = aggregationResult[0] || {
            totalLoans: 0,
            totalAmount: 0,
            totalReceivable: 0,
            totalRecovered: 0,
            totalOutstanding: 0,
            totalArrears: 0,
            avgLoanSize: 0,
            activeLoans: 0,
            overdueLoans: 0
        };

        // Get loans by product type
        const loansByProduct = await Loan.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: "products",
                    localField: "productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            {
                $group: {
                    _id: "$product.name",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$grantedAmount" },
                    totalOutstanding: { $sum: "$outstanding" }
                }
            }
        ]);

        return {
            summary,
            loanDetails,
            loansByProduct,
            filters: filters
        };
    }

    /**
     * Get collection report data
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} Collection report data
     */
    static async getCollectionReport(filters = {}) {
        let matchStage = {};

        // Apply date filters for repayments
        if (filters.startDate || filters.endDate) {
            matchStage.paymentDate = {};
            if (filters.startDate) {
                matchStage.paymentDate.$gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                matchStage.paymentDate.$lte = new Date(filters.endDate);
            }
        }

        // Apply branch filter
        if (filters.branchId) {
            matchStage.branchId = filters.branchId;
        }

        // Get repayment details
        const repaymentDetails = await Repayment.find(matchStage)
            .populate('loanId', 'loanId grantedAmount totalReceivable')
            .populate('customerId', 'firstName lastName')
            .populate('centerId', 'name')
            .populate('branchId', 'name')
            .sort({ paymentDate: -1 });

        // Get collection summary
        const collectionSummary = await Repayment.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalRepayments: { $sum: 1 },
                    totalAmountCollected: { $sum: "$amount" },
                    avgRepaymentAmount: { $avg: "$amount" }
                }
            }
        ]);

        // Get daily collection data
        const dailyCollections = await Repayment.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        date: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$paymentDate"
                            }
                        }
                    },
                    totalAmount: { $sum: "$amount" },
                    repaymentCount: { $sum: 1 }
                }
            },
            { $sort: { "_id.date": -1 } },
            { $limit: 30 } // Last 30 days
        ]);

        // Get collection by branch
        const collectionsByBranch = await Repayment.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: "branches",
                    localField: "branchId",
                    foreignField: "_id",
                    as: "branch"
                }
            },
            { $unwind: "$branch" },
            {
                $group: {
                    _id: "$branch.name",
                    totalAmount: { $sum: "$amount" },
                    repaymentCount: { $sum: 1 }
                }
            }
        ]);

        const summary = collectionSummary[0] || {
            totalRepayments: 0,
            totalAmountCollected: 0,
            avgRepaymentAmount: 0
        };

        return {
            summary,
            repaymentDetails,
            dailyCollections,
            collectionsByBranch,
            filters: filters
        };
    }

    /**
     * Get portfolio analysis report
     * @returns {Promise<Object>} Portfolio analysis data
     */
    static async getPortfolioAnalysis() {
        // Portfolio by branch
        const portfolioByBranch = await Loan.aggregate([
            {
                $lookup: {
                    from: "branches",
                    localField: "branchId",
                    foreignField: "_id",
                    as: "branch"
                }
            },
            { $unwind: "$branch" },
            {
                $group: {
                    _id: "$branch.name",
                    totalLoans: { $sum: 1 },
                    totalAmount: { $sum: "$grantedAmount" },
                    totalOutstanding: { $sum: "$outstanding" },
                    totalArrears: { $sum: "$arrearsAmount" },
                    activeLoans: {
                        $sum: {
                            $cond: [{ $gt: ["$outstanding", 0] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        // Portfolio by product
        const portfolioByProduct = await Loan.aggregate([
            {
                $lookup: {
                    from: "products",
                    localField: "productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            {
                $group: {
                    _id: {
                        name: "$product.name",
                        type: "$product.type"
                    },
                    totalLoans: { $sum: 1 },
                    totalAmount: { $sum: "$grantedAmount" },
                    totalOutstanding: { $sum: "$outstanding" },
                    totalArrears: { $sum: "$arrearsAmount" }
                }
            }
        ]);

        // Aging analysis
        const agingAnalysis = await Loan.aggregate([
            {
                $match: { outstanding: { $gt: 0 } }
            },
            {
                $project: {
                    outstanding: 1,
                    arrearsAmount: 1,
                    agingCategory: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$arrearsAmount", 0] }, then: "Current" },
                                { case: { $lte: ["$arrearsAmount", 1000] }, then: "1-30 Days" },
                                { case: { $lte: ["$arrearsAmount", 5000] }, then: "31-60 Days" },
                                { case: { $lte: ["$arrearsAmount", 10000] }, then: "61-90 Days" }
                            ],
                            default: "90+ Days"
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$agingCategory",
                    count: { $sum: 1 },
                    totalOutstanding: { $sum: "$outstanding" },
                    totalArrears: { $sum: "$arrearsAmount" }
                }
            }
        ]);

        return {
            portfolioByBranch,
            portfolioByProduct,
            agingAnalysis
        };
    }

    /**
     * Get all reports data combined
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} All reports data
     */
    static async getAllReports(filters = {}) {
        const [overviewData, loanData, collectionData, portfolioData] = await Promise.all([
            this.getOverviewReport(),
            this.getLoanReport(filters),
            this.getCollectionReport(filters),
            this.getPortfolioAnalysis()
        ]);

        return {
            overview: overviewData,
            loans: loanData,
            collections: collectionData,
            portfolio: portfolioData,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Get customer performance report
     * @param {Object} filters - Filter options
     * @returns {Promise<Object>} Customer performance data
     */
    static async getCustomerPerformanceReport(filters = {}) {
        let matchStage = {};

        if (filters.branchId) {
            matchStage.branchId = filters.branchId;
        }
        if (filters.centerId) {
            matchStage.centerId = filters.centerId;
        }

        const customerPerformance = await Loan.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: "customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            { $unwind: "$customer" },
            {
                $group: {
                    _id: "$customerId",
                    customerName: { $first: { $concat: ["$customer.firstName", " ", "$customer.lastName"] } },
                    totalLoans: { $sum: 1 },
                    totalAmount: { $sum: "$grantedAmount" },
                    totalOutstanding: { $sum: "$outstanding" },
                    totalArrears: { $sum: "$arrearsAmount" },
                    avgLoanSize: { $avg: "$grantedAmount" }
                }
            },
            {
                $project: {
                    customerName: 1,
                    totalLoans: 1,
                    totalAmount: 1,
                    totalOutstanding: 1,
                    totalArrears: 1,
                    avgLoanSize: 1,
                    performanceScore: {
                        $cond: [
                            { $eq: ["$totalArrears", 0] },
                            100,
                            {
                                $max: [
                                    0,
                                    {
                                        $subtract: [
                                            100,
                                            {
                                                $multiply: [
                                                    { $divide: ["$totalArrears", "$totalAmount"] },
                                                    100
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
            },
            { $sort: { performanceScore: -1 } }
        ]);

        return {
            customerPerformance,
            filters: filters
        };
    }

    /**
     * Export report data to CSV format
     * @param {string} reportType - Type of report
     * @param {Object} data - Report data
     * @returns {string} CSV formatted string
     */
    static exportToCSV(reportType, data) {
        switch (reportType) {
            case 'loans':
                return this.convertLoansToCSV(data.loanDetails);
            case 'collections':
                return this.convertCollectionsToCSV(data.repaymentDetails);
            case 'overview':
                return this.convertOverviewToCSV(data);
            default:
                throw new Error("Unsupported report type for CSV export");
        }
    }

    /**
     * Convert loans data to CSV format
     * @param {Array} loans - Loan data
     * @returns {string} CSV string
     */
    static convertLoansToCSV(loans) {
        const headers = [
            'Loan ID', 'Customer Name', 'Product', 'Granted Amount', 
            'Total Receivable', 'Outstanding', 'Arrears', 'Status', 
            'Granted Date', 'Branch', 'Center'
        ];

        const rows = loans.map(loan => [
            loan.loanId,
            `${loan.customerId?.firstName || ''} ${loan.customerId?.lastName || ''}`,
            loan.productId?.name || '',
            loan.grantedAmount,
            loan.totalReceivable,
            loan.outstanding,
            loan.arrearsAmount,
            loan.outstanding > 0 ? 'Active' : 'Completed',
            loan.grantedDate?.toISOString().split('T')[0] || '',
            loan.branchId?.name || '',
            loan.centerId?.name || ''
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }

    /**
     * Convert collections data to CSV format
     * @param {Array} repayments - Repayment data
     * @returns {string} CSV string
     */
    static convertCollectionsToCSV(repayments) {
        const headers = [
            'Payment Date', 'Customer Name', 'Loan ID', 'Amount', 
            'Payment Method', 'Branch', 'Center'
        ];

        const rows = repayments.map(repayment => [
            repayment.paymentDate?.toISOString().split('T')[0] || '',
            `${repayment.customerId?.firstName || ''} ${repayment.customerId?.lastName || ''}`,
            repayment.loanId?.loanId || '',
            repayment.amount,
            repayment.paymentMethod || '',
            repayment.branchId?.name || '',
            repayment.centerId?.name || ''
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }

    /**
     * Convert overview data to CSV format
     * @param {Object} overview - Overview data
     * @returns {string} CSV string
     */
    static convertOverviewToCSV(overview) {
        const data = [
            ['Metric', 'Value'],
            ['Total Loans', overview.totalLoans],
            ['Active Loans', overview.activeLoans],
            ['Completed Loans', overview.completedLoans],
            ['Total Customers', overview.totalCustomers],
            ['Total Centers', overview.totalCenters],
            ['Total Branches', overview.totalBranches],
            ['Total Portfolio', overview.portfolio.totalAmount],
            ['Total Outstanding', overview.portfolio.totalOutstanding],
            ['Total Arrears', overview.portfolio.totalArrears],
            ['Collection Rate (%)', overview.metrics.collectionRate],
            ['Portfolio at Risk (%)', overview.metrics.portfolioAtRisk]
        ];

        return data
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }
}

module.exports = ReportsService;

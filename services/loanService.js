const Loan = require("../models/Loan");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Holiday = require("../models/Holiday");

class LoanService {
    /**
     * Calculate arrears amount for a loan (without holidays)
     * @param {Object} loan - Loan object
     * @param {Object} product - Product object
     * @returns {number} Arrears amount
     */
    static calculateArrearsAmount(loan, product) {
        const { firstDueDate, totalReceivable, recovered, period } = loan;
        const { type } = product;

        const currentDate = new Date();
        const loanStartDate = new Date(firstDueDate);

        // Calculate time difference in days
        const timeDiff = currentDate.getTime() - loanStartDate.getTime();
        const daysPassed = Math.floor(timeDiff / (1000 * 3600 * 24));

        // If no days have passed or negative days, no arrears
        if (daysPassed <= 0) return 0;

        let expectedRecovered = 0;
        const installmentAmount = totalReceivable / period;

        switch (type?.toLowerCase()) {
            case "daily":
                expectedRecovered = Math.min(daysPassed * installmentAmount, totalReceivable);
                break;
            case "weekly":
                const weeksPassed = Math.floor(daysPassed / 7);
                expectedRecovered = Math.min(weeksPassed * installmentAmount, totalReceivable);
                break;
            case "monthly":
                const monthsPassed = Math.floor(daysPassed / 30);
                expectedRecovered = Math.min(monthsPassed * installmentAmount, totalReceivable);
                break;
            default:
                expectedRecovered = 0;
        }

        return Math.max(expectedRecovered - (recovered || 0), 0);
    }

    /**
     * Calculate arrears amount considering holidays (for daily products)
     * @param {Object} loan - Loan object
     * @param {Object} product - Product object
     * @returns {Promise<number>} Arrears amount
     */
    static async calculateArrearsAmountWithHolidays(loan, product) {
        const basic = this.calculateArrearsAmount(loan, product);

        // Only adjust for daily repayment products
        if (product?.type?.toLowerCase() !== "daily") {
            return basic;
        }

        try {
            const firstDueDate = new Date(loan.firstDueDate);
            const now = new Date();

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
            return Math.max(expectedRecovered - (loan.recovered || 0), 0);
        } catch (error) {
            console.error("Error adjusting arrears for holidays:", error);
            return basic;
        }
    }

    /**
     * Create a new loan
     * @param {Object} loanData - Loan data
     * @param {Object} files - Uploaded files
     * @returns {Promise<Object>} Created loan
     */
    static async createLoan(loanData, files = {}) {
        const { customerId, productId, grantedAmount, grantedDate } = loanData;
        
        const parsedGrantedDate = new Date(grantedDate);
        if (isNaN(parsedGrantedDate.getTime())) {
            throw new Error("Invalid granted date");
        }

        // Validate customer exists
        const customer = await Customer.findById(customerId);
        if (!customer) {
            throw new Error("Customer not found");
        }

        // Validate product exists
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error("Product not found");
        }

        // Calculate loan details
        const interestRate = product.interest;
        const period = product.terms;
        const gracePeriod = parseInt(product.Grace_period || 0, 10);
        const documentCharges = product.docCharges;
        const totalReceivable = parseFloat(grantedAmount) + (parseFloat(grantedAmount) * (interestRate / 100));
        const outstanding = totalReceivable;
        const loanId = "LN" + Date.now();

        const firstDueDate = new Date(parsedGrantedDate.getTime() + gracePeriod * 24 * 60 * 60 * 1000);

        // Calculate initial arrears
        const tempLoanForArrears = {
            loanId,
            grantedDate: parsedGrantedDate,
            firstDueDate,
            totalReceivable,
            period,
            recovered: 0,
            centerId: customer.centerId,
            productId,
        };
        const arrearsAmount = await this.calculateArrearsAmountWithHolidays(tempLoanForArrears, product);

        // Handle supporting documents
        const supportingDocuments = {
            loanApplication: files?.loanApplication?.[0]?.path || "",
            clientNIC: files?.clientNIC?.[0]?.path || "",
            guarantorNIC1: files?.guarantorNIC1?.[0]?.path || "",
            guarantorNIC2: files?.guarantorNIC2?.[0]?.path || "",
            otherProof: files?.otherProof?.[0]?.path || "",
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
            recovered: 0,
            arrearsAmount,
            centerId: customer.centerId,
            branchId: customer.branchId,
            supportingDocuments,
        });

        return await loan.save();
    }

    /**
     * Get all loans with populated data
     * @returns {Promise<Array>} List of loans
     */
    static async getAllLoans() {
        return await Loan.find()
            .populate("customerId", "firstName lastName email NIC_no")
            .populate("productId", "name type interest terms")
            .populate("centerId", "name location")
            .populate("branchId", "name address")
            .sort({ createdAt: -1 });
    }

    /**
     * Get loan by ID
     * @param {string} loanId - Loan ID
     * @returns {Promise<Object>} Loan object
     */
    static async getLoanById(loanId) {
        const loan = await Loan.findById(loanId)
            .populate("customerId", "firstName lastName email NIC_no")
            .populate("productId", "name type interest terms")
            .populate("centerId", "name location")
            .populate("branchId", "name address");
        
        if (!loan) {
            throw new Error("Loan not found");
        }
        return loan;
    }

    /**
     * Get loans by customer ID
     * @param {string} customerId - Customer ID
     * @returns {Promise<Array>} List of loans
     */
    static async getLoansByCustomer(customerId) {
        return await Loan.find({ customerId })
            .populate("productId", "name type interest terms")
            .populate("centerId", "name location")
            .populate("branchId", "name address")
            .sort({ createdAt: -1 });
    }

    /**
     * Update loan by ID
     * @param {string} loanId - Loan ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object>} Updated loan
     */
    static async updateLoan(loanId, updateData) {
        const loan = await Loan.findByIdAndUpdate(loanId, updateData, { new: true })
            .populate("customerId", "firstName lastName email NIC_no")
            .populate("productId", "name type interest terms")
            .populate("centerId", "name location")
            .populate("branchId", "name address");
        
        if (!loan) {
            throw new Error("Loan not found");
        }
        return loan;
    }

    /**
     * Delete loan by ID
     * @param {string} loanId - Loan ID
     * @returns {Promise<Object>} Deleted loan
     */
    static async deleteLoan(loanId) {
        const loan = await Loan.findByIdAndDelete(loanId);
        if (!loan) {
            throw new Error("Loan not found");
        }
        return loan;
    }

    /**
     * Get loans by center ID
     * @param {string} centerId - Center ID
     * @returns {Promise<Array>} List of loans
     */
    static async getLoansByCenter(centerId) {
        return await Loan.find({ centerId })
            .populate("customerId", "firstName lastName email NIC_no")
            .populate("productId", "name type interest terms")
            .sort({ createdAt: -1 });
    }

    /**
     * Get active loans (outstanding > 0)
     * @returns {Promise<Array>} List of active loans
     */
    static async getActiveLoans() {
        return await Loan.find({ outstanding: { $gt: 0 } })
            .populate("customerId", "firstName lastName email NIC_no")
            .populate("productId", "name type interest terms")
            .populate("centerId", "name location")
            .sort({ createdAt: -1 });
    }

    /**
     * Get overdue loans (arrears > 0)
     * @returns {Promise<Array>} List of overdue loans
     */
    static async getOverdueLoans() {
        return await Loan.find({ arrearsAmount: { $gt: 0 } })
            .populate("customerId", "firstName lastName email NIC_no")
            .populate("productId", "name type interest terms")
            .populate("centerId", "name location")
            .sort({ arrearsAmount: -1 });
    }

    /**
     * Update loan arrears for all active loans
     * @returns {Promise<number>} Number of loans updated
     */
    static async updateAllLoanArrears() {
        const activeLoans = await Loan.find({ outstanding: { $gt: 0 } }).populate('productId');
        let updatedCount = 0;

        for (const loan of activeLoans) {
            if (loan.productId) {
                const newArrears = await this.calculateArrearsAmountWithHolidays(loan, loan.productId);
                if (newArrears !== loan.arrearsAmount) {
                    await Loan.findByIdAndUpdate(loan._id, { arrearsAmount: newArrears });
                    updatedCount++;
                }
            }
        }

        return updatedCount;
    }

    /**
     * Get loan statistics
     * @returns {Promise<Object>} Loan statistics
     */
    static async getLoanStatistics() {
        const totalLoans = await Loan.countDocuments();
        const activeLoans = await Loan.countDocuments({ outstanding: { $gt: 0 } });
        const completedLoans = await Loan.countDocuments({ outstanding: { $lte: 0 } });
        const overdueLoans = await Loan.countDocuments({ arrearsAmount: { $gt: 0 } });

        const portfolioData = await Loan.aggregate([
            {
                $group: {
                    _id: null,
                    totalGranted: { $sum: "$grantedAmount" },
                    totalReceivable: { $sum: "$totalReceivable" },
                    totalRecovered: { $sum: "$recovered" },
                    totalOutstanding: { $sum: "$outstanding" },
                    totalArrears: { $sum: "$arrearsAmount" }
                }
            }
        ]);

        const portfolio = portfolioData[0] || {
            totalGranted: 0,
            totalReceivable: 0,
            totalRecovered: 0,
            totalOutstanding: 0,
            totalArrears: 0
        };

        return {
            totalLoans,
            activeLoans,
            completedLoans,
            overdueLoans,
            ...portfolio,
            collectionRate: portfolio.totalReceivable > 0 
                ? ((portfolio.totalRecovered / portfolio.totalReceivable) * 100).toFixed(2)
                : 0
        };
    }
}

module.exports = LoanService;

const Center = require("../models/Center");
const Customer = require("../models/Customer");
const Loan = require("../models/Loan");

class CenterService {
    /**
     * Create a new center
     * @param {Object} centerData - Center data
     * @returns {Promise<Object>} Created center
     */
    static async createCenter(centerData) {
        // Normalize input: accept either `branch` or `branchId` from caller
        const branchValue = centerData.branch || centerData.branchId;

        // Validate required fields
        if (!centerData.name || !branchValue) {
            throw new Error("Center name and branch ID are required");
        }

        // Check if center name already exists in the same branch
        const existingCenter = await Center.findOne({
            name: { $regex: new RegExp(`^${centerData.name}$`, 'i') },
            branch: branchValue
        });
        
        if (existingCenter) {
            throw new Error("Center with this name already exists in this branch");
        }

        // Build the document using the model's `branch` field
        const centerDoc = {
            name: centerData.name,
            collectDay: centerData.collectDay,
            branch: branchValue,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const center = new Center(centerDoc);

        return await center.save();
    }

    /**
     * Get all centers with populated branch data
     * @param {Object} filters - Optional filters
     * @returns {Promise<Array>} List of centers
     */
    static async getAllCenters(filters = {}) {
        const query = {};

        // Apply filters if provided
        if (filters.branchId) {
            query.branch = filters.branchId;
        }
        if (filters.isActive !== undefined) {
            query.isActive = filters.isActive;
        }

        return await Center.find(query)
            .populate('branch', 'name address region')
            .sort({ name: 1 });
    }

    /**
     * Get center by ID with populated data
     * @param {string} centerId - Center ID
     * @returns {Promise<Object>} Center object
     */
    static async getCenterById(centerId) {
        const center = await Center.findById(centerId)
            .populate('branch', 'name address region');
        
        if (!center) {
            throw new Error("Center not found");
        }
        return center;
    }

    /**
     * Update center by ID
     * @param {string} centerId - Center ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated center
     */
    static async updateCenter(centerId, updateData) {
        // If updating name, check for duplicates in the same branch
        if (updateData.name || updateData.branchId) {
            const existingCenter = await Center.findOne({
                name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
                branch: updateData.branchId,
                _id: { $ne: centerId }
            });
            
            if (existingCenter) {
                throw new Error("Center with this name already exists in this branch");
            }
        }

        // Map branchId to branch field if provided
        const mappedUpdateData = {
            ...updateData,
            updatedAt: new Date()
        };
        
        if (updateData.branchId) {
            mappedUpdateData.branch = updateData.branchId;
            delete mappedUpdateData.branchId;
        }

        const center = await Center.findByIdAndUpdate(centerId, mappedUpdateData, { new: true })
            .populate('branch', 'name address region');
        
        if (!center) {
            throw new Error("Center not found");
        }
        return center;
    }

    /**
     * Delete center by ID
     * @param {string} centerId - Center ID
     * @returns {Promise<Object>} Deleted center
     */
    static async deleteCenter(centerId) {
        // Check if center has associated customers or loans
        const customerCount = await Customer.countDocuments({ centerId });
        const loanCount = await Loan.countDocuments({ centerId });
        
        if (customerCount > 0 || loanCount > 0) {
            throw new Error("Cannot delete center with associated customers or loans");
        }

        const center = await Center.findByIdAndDelete(centerId);
        if (!center) {
            throw new Error("Center not found");
        }
        return center;
    }

    /**
     * Get centers by branch ID
     * @param {string} branchId - Branch ID
     * @returns {Promise<Array>} List of centers in branch
     */
    static async getCentersByBranch(branchId) {
        return await Center.find({ branch: branchId, isActive: true })
            .sort({ name: 1 });
    }

    /**
     * Get active centers
     * @returns {Promise<Array>} List of active centers
     */
    static async getActiveCenters() {
        return await Center.find({ isActive: true })
            .populate('branch', 'name')
            .sort({ name: 1 });
    }

    /**
     * Search centers by name or location
     * @param {string} searchTerm - Search term
     * @returns {Promise<Array>} List of matching centers
     */
    static async searchCenters(searchTerm) {
        const searchRegex = new RegExp(searchTerm, 'i'); // Case-insensitive search
        
        return await Center.find({
            $or: [
                { name: searchRegex },
                { location: searchRegex },
                { description: searchRegex }
            ]
        })
            .populate('branch', 'name')
            .sort({ name: 1 });
    }

    /**
     * Get center with detailed information
     * @param {string} centerId - Center ID
     * @returns {Promise<Object>} Center with detailed data
     */
    static async getCenterWithDetails(centerId) {
        const center = await this.getCenterById(centerId);
        
        // Get associated customers
        const customers = await Customer.find({ centerId })
            .select('firstName lastName email phone')
            .sort({ firstName: 1 });

        // Get associated loans
        const loans = await Loan.find({ centerId })
            .select('loanId grantedAmount outstanding arrearsAmount')
            .populate('customerId', 'firstName lastName')
            .sort({ grantedDate: -1 });

        // Calculate center statistics
        const totalCustomers = customers.length;
        const totalLoans = loans.length;
        const totalPortfolio = loans.reduce((sum, loan) => sum + loan.grantedAmount, 0);
        const totalOutstanding = loans.reduce((sum, loan) => sum + loan.outstanding, 0);
        const totalArrears = loans.reduce((sum, loan) => sum + loan.arrearsAmount, 0);
        const activeLoans = loans.filter(loan => loan.outstanding > 0).length;

        return {
            ...center.toObject(),
            customers,
            loans,
            statistics: {
                totalCustomers,
                totalLoans,
                activeLoans,
                totalPortfolio,
                totalOutstanding,
                totalArrears,
                collectionRate: totalPortfolio > 0 
                    ? ((totalPortfolio - totalOutstanding) / totalPortfolio * 100).toFixed(2)
                    : 0
            }
        };
    }

    /**
     * Get center statistics
     * @returns {Promise<Object>} Center statistics
     */
    static async getCenterStatistics() {
        const totalCenters = await Center.countDocuments();
        const activeCenters = await Center.countDocuments({ isActive: true });
        const inactiveCenters = await Center.countDocuments({ isActive: false });

        // Get center details with customer and loan counts
        const centerDetails = await Center.aggregate([
            {
                $lookup: {
                    from: "customers",
                    localField: "_id",
                    foreignField: "centerId",
                    as: "customers"
                }
            },
            {
                $lookup: {
                    from: "loans",
                    localField: "_id",
                    foreignField: "centerId",
                    as: "loans"
                }
            },
            {
                $lookup: {
                    from: "branches",
                    localField: "branchId",
                    foreignField: "_id",
                    as: "branch"
                }
            },
            {
                $unwind: "$branch"
            },
            {
                $project: {
                    name: 1,
                    location: 1,
                    isActive: 1,
                    branchName: "$branch.name",
                    customerCount: { $size: "$customers" },
                    loanCount: { $size: "$loans" },
                    totalPortfolio: { $sum: "$loans.grantedAmount" },
                    totalOutstanding: { $sum: "$loans.outstanding" },
                    totalArrears: { $sum: "$loans.arrearsAmount" }
                }
            }
        ]);

        // Get centers by branch
        const centersByBranch = await Center.aggregate([
            {
                $lookup: {
                    from: "branches",
                    localField: "branchId",
                    foreignField: "_id",
                    as: "branch"
                }
            },
            {
                $unwind: "$branch"
            },
            {
                $group: {
                    _id: "$branch.name",
                    count: { $sum: 1 },
                    activeCount: {
                        $sum: {
                            $cond: [{ $eq: ["$isActive", true] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        return {
            totalCenters,
            activeCenters,
            inactiveCenters,
            centerDetails,
            centersByBranch
        };
    }

    /**
     * Toggle center active status
     * @param {string} centerId - Center ID
     * @returns {Promise<Object>} Updated center
     */
    static async toggleCenterStatus(centerId) {
        const center = await Center.findById(centerId);
        if (!center) {
            throw new Error("Center not found");
        }

        center.isActive = !center.isActive;
        center.updatedAt = new Date();
        
        return await center.save();
    }

    /**
     * Validate center data
     * @param {Object} centerData - Center data to validate
     * @returns {Array} Array of validation errors
     */
    static validateCenterData(centerData) {
        const errors = [];

        // Name validation
        if (!centerData.name || centerData.name.trim().length === 0) {
            errors.push("Center name is required");
        }

        // Branch ID validation
        if (!centerData.branch && !centerData.branchId) {
            errors.push("Branch ID is required");
        }

        // Meeting day validation (if provided)
        if (centerData.meetingDay) {
            const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            if (!validDays.includes(centerData.meetingDay.toLowerCase())) {
                errors.push("Invalid meeting day");
            }
        }

        // Meeting time validation (if provided)
        if (centerData.meetingTime) {
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(centerData.meetingTime)) {
                errors.push("Invalid meeting time format (use HH:MM)");
            }
        }

        return errors;
    }

    /**
     * Get center performance report
     * @param {string} centerId - Center ID
     * @param {Object} dateRange - Date range for analysis
     * @returns {Promise<Object>} Center performance data
     */
    static async getCenterPerformance(centerId, dateRange = {}) {
        const center = await this.getCenterById(centerId);
        
        let loanQuery = { centerId };
        if (dateRange.startDate || dateRange.endDate) {
            loanQuery.grantedDate = {};
            if (dateRange.startDate) {
                loanQuery.grantedDate.$gte = new Date(dateRange.startDate);
            }
            if (dateRange.endDate) {
                loanQuery.grantedDate.$lte = new Date(dateRange.endDate);
            }
        }

        // Get loan performance data
        const loanPerformance = await Loan.aggregate([
            { $match: loanQuery },
            {
                $group: {
                    _id: null,
                    totalLoans: { $sum: 1 },
                    totalAmount: { $sum: "$grantedAmount" },
                    totalReceivable: { $sum: "$totalReceivable" },
                    totalRecovered: { $sum: "$recovered" },
                    totalOutstanding: { $sum: "$outstanding" },
                    totalArrears: { $sum: "$arrearsAmount" },
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
        ]);

        const performance = loanPerformance[0] || {
            totalLoans: 0,
            totalAmount: 0,
            totalReceivable: 0,
            totalRecovered: 0,
            totalOutstanding: 0,
            totalArrears: 0,
            activeLoans: 0,
            overdueLoans: 0
        };

        // Calculate metrics
        const collectionRate = performance.totalReceivable > 0 
            ? ((performance.totalRecovered / performance.totalReceivable) * 100).toFixed(2)
            : 0;
        
        const portfolioAtRisk = performance.totalLoans > 0 
            ? ((performance.overdueLoans / performance.totalLoans) * 100).toFixed(2)
            : 0;

        return {
            center: center,
            performance: {
                ...performance,
                collectionRate: parseFloat(collectionRate),
                portfolioAtRisk: parseFloat(portfolioAtRisk)
            },
            dateRange: dateRange
        };
    }

    /**
     * Get meeting schedule for centers
     * @param {string} branchId - Branch ID (optional)
     * @returns {Promise<Array>} Meeting schedule
     */
    static async getMeetingSchedule(branchId = null) {
        const query = { isActive: true };
        if (branchId) {
            query.branch = branchId;
        }

        return await Center.find(query)
            .populate('branch', 'name')
            .select('name location meetingDay meetingTime branch')
            .sort({ meetingDay: 1, meetingTime: 1 });
    }
}

module.exports = CenterService;

const Branch = require("../models/Branch");

class BranchService {
    /**
     * Create a new branch
     * @param {Object} branchData - Branch data
     * @returns {Promise<Object>} Created branch
     */
    static async createBranch(branchData) {
        // Validate required fields
        if (!branchData.name) {
            throw new Error("Branch name is required");
        }

        // Check if branch name already exists
        const existingBranch = await Branch.findOne({ 
            name: { $regex: new RegExp(`^${branchData.name}$`, 'i') } 
        });
        
        if (existingBranch) {
            throw new Error("Branch with this name already exists");
        }

        const branch = new Branch({
            ...branchData,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return await branch.save();
    }

    /**
     * Get all branches
     * @param {Object} filters - Optional filters
     * @returns {Promise<Array>} List of branches
     */
    static async getAllBranches(filters = {}) {
        const query = {};

        // Apply filters if provided
        if (filters.isActive !== undefined) {
            query.isActive = filters.isActive;
        }
        if (filters.region) {
            query.region = { $regex: new RegExp(filters.region, 'i') };
        }

        return await Branch.find(query).sort({ name: 1 });
    }

    /**
     * Get branch by ID
     * @param {string} branchId - Branch ID
     * @returns {Promise<Object>} Branch object
     */
    static async getBranchById(branchId) {
        const branch = await Branch.findById(branchId);
        if (!branch) {
            throw new Error("Branch not found");
        }
        return branch;
    }

    /**
     * Update branch by ID
     * @param {string} branchId - Branch ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated branch
     */
    static async updateBranch(branchId, updateData) {
        // If updating name, check for duplicates
        if (updateData.name) {
            const existingBranch = await Branch.findOne({
                name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
                _id: { $ne: branchId }
            });
            
            if (existingBranch) {
                throw new Error("Branch with this name already exists");
            }
        }

        const branch = await Branch.findByIdAndUpdate(branchId, {
            ...updateData,
            updatedAt: new Date()
        }, { new: true });
        
        if (!branch) {
            throw new Error("Branch not found");
        }
        return branch;
    }

    /**
     * Delete branch by ID
     * @param {string} branchId - Branch ID
     * @returns {Promise<Object>} Deleted branch
     */
    static async deleteBranch(branchId) {
        // Check if branch has associated customers or centers
        const Customer = require("../models/Customer");
        const Center = require("../models/Center");
        
        const customerCount = await Customer.countDocuments({ branchId });
        const centerCount = await Center.countDocuments({ branchId });
        
        if (customerCount > 0 || centerCount > 0) {
            throw new Error("Cannot delete branch with associated customers or centers");
        }

        const branch = await Branch.findByIdAndDelete(branchId);
        if (!branch) {
            throw new Error("Branch not found");
        }
        return branch;
    }

    /**
     * Get active branches
     * @returns {Promise<Array>} List of active branches
     */
    static async getActiveBranches() {
        return await Branch.find({ isActive: true }).sort({ name: 1 });
    }

    /**
     * Search branches by name
     * @param {string} searchTerm - Search term
     * @returns {Promise<Array>} List of matching branches
     */
    static async searchBranches(searchTerm) {
        const searchRegex = new RegExp(searchTerm, 'i'); // Case-insensitive search
        
        return await Branch.find({
            $or: [
                { name: searchRegex },
                { address: searchRegex },
                { region: searchRegex }
            ]
        }).sort({ name: 1 });
    }

    /**
     * Get branches by region
     * @param {string} region - Region name
     * @returns {Promise<Array>} List of branches in region
     */
    static async getBranchesByRegion(region) {
        return await Branch.find({ 
            region: { $regex: new RegExp(region, 'i') } 
        }).sort({ name: 1 });
    }

    /**
     * Get branch statistics
     * @returns {Promise<Object>} Branch statistics
     */
    static async getBranchStatistics() {
        const totalBranches = await Branch.countDocuments();
        const activeBranches = await Branch.countDocuments({ isActive: true });
        const inactiveBranches = await Branch.countDocuments({ isActive: false });

        // Get customer and center counts per branch
        const Customer = require("../models/Customer");
        const Center = require("../models/Center");
        const Loan = require("../models/Loan");

        const branchDetails = await Branch.aggregate([
            {
                $lookup: {
                    from: "customers",
                    localField: "_id",
                    foreignField: "branchId",
                    as: "customers"
                }
            },
            {
                $lookup: {
                    from: "centers",
                    localField: "_id",
                    foreignField: "branchId",
                    as: "centers"
                }
            },
            {
                $lookup: {
                    from: "loans",
                    localField: "_id",
                    foreignField: "branchId",
                    as: "loans"
                }
            },
            {
                $project: {
                    name: 1,
                    region: 1,
                    isActive: 1,
                    customerCount: { $size: "$customers" },
                    centerCount: { $size: "$centers" },
                    loanCount: { $size: "$loans" },
                    totalPortfolio: { $sum: "$loans.grantedAmount" },
                    totalOutstanding: { $sum: "$loans.outstanding" }
                }
            }
        ]);

        const branchesByRegion = await Branch.aggregate([
            {
                $group: {
                    _id: "$region",
                    count: { $sum: 1 }
                }
            }
        ]);

        return {
            totalBranches,
            activeBranches,
            inactiveBranches,
            branchDetails,
            branchesByRegion
        };
    }

    /**
     * Toggle branch active status
     * @param {string} branchId - Branch ID
     * @returns {Promise<Object>} Updated branch
     */
    static async toggleBranchStatus(branchId) {
        const branch = await Branch.findById(branchId);
        if (!branch) {
            throw new Error("Branch not found");
        }

        branch.isActive = !branch.isActive;
        branch.updatedAt = new Date();
        
        return await branch.save();
    }

    /**
     * Validate branch data
     * @param {Object} branchData - Branch data to validate
     * @returns {Array} Array of validation errors
     */
    static validateBranchData(branchData) {
        const errors = [];

        // Name validation
        if (!branchData.name || branchData.name.trim().length === 0) {
            errors.push("Branch name is required");
        }

        // Phone validation (if provided)
        if (branchData.phone) {
            const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,}$/;
            if (!phoneRegex.test(branchData.phone)) {
                errors.push("Invalid phone number format");
            }
        }

        // Email validation (if provided)
        if (branchData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(branchData.email)) {
                errors.push("Invalid email format");
            }
        }

        return errors;
    }

    /**
     * Get branch with associated data
     * @param {string} branchId - Branch ID
     * @returns {Promise<Object>} Branch with associated data
     */
    static async getBranchWithDetails(branchId) {
        const branch = await this.getBranchById(branchId);
        
        const Customer = require("../models/Customer");
        const Center = require("../models/Center");
        const Loan = require("../models/Loan");

        const [customers, centers, loans] = await Promise.all([
            Customer.find({ branchId }).select('firstName lastName email'),
            Center.find({ branchId }).select('name location'),
            Loan.find({ branchId }).select('loanId grantedAmount outstanding')
        ]);

        return {
            ...branch.toObject(),
            customers,
            centers,
            loans,
            statistics: {
                customerCount: customers.length,
                centerCount: centers.length,
                loanCount: loans.length,
                totalPortfolio: loans.reduce((sum, loan) => sum + loan.grantedAmount, 0),
                totalOutstanding: loans.reduce((sum, loan) => sum + loan.outstanding, 0)
            }
        };
    }
}

module.exports = BranchService;

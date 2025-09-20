const Branch = require('../models/Branch');

class BranchService {
    static async create_branch(branch_data) {
        const branch = new Branch({
            ...branch_data,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return await branch.save();
    }

    static async get_All_Branchs() {
        return await Branch.find();
    }
    
    static async getBranchById(branchID) {
        const branch = await Branch.findById(branchID);
        if (!branch) {
            throw new Error('Branch not found');
        }
        return branch;
    }

    static async updateBranch(branchID, updateData) {
        const branch = await Branch.findByIdAndUpdate(branchID, updateData, { new: true });
        if (!branch) {
            throw new Error('Branch not found');
        }
        return branch;
    }

    static async DeleteBranch(branchID) {
        const branch = await Branch.findByIdAndDelete(branchID);
        if (!branch) {
            throw new Error('Branch not found');
        }
        return branch;
    }
}

module.exports = BranchService;
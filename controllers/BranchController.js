const Branch = require('../models/Branch');

// Create a new branch
exports.createBranch = async (req, res) => {
    try {
        const branchData = {
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const branch = new Branch(branchData);
        const savedBranch = await branch.save();
        res.status(201).json(savedBranch);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all branches
exports.getBranches = async (req, res) => {
    try {
        const branches = await Branch.find();
        res.status(200).json(branches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single branch by ID
exports.getBranchById = async (req, res) => {
    try {
        const branch = await Branch.findById(req.params.id);
        if (!branch) return res.status(404).json({ message: "Branch not found" });
        res.status(200).json(branch);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a branch by ID
exports.updateBranch = async (req, res) => {
    try {
        const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!branch) return res.status(404).json({ message: "Branch not found" });
        res.status(200).json(branch);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a branch by ID
exports.deleteBranch = async (req, res) => {
    try {
        const branch = await Branch.findByIdAndDelete(req.params.id);
        if (!branch) return res.status(404).json({ message: "Branch not found" });
        res.status(204).json({ message: "Branch deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

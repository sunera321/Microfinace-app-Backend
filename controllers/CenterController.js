const Center = require('../models/Center');
const Branch = require('../models/Branch');

// Create a new center
exports.createCenter = async (req, res) => {
    try {
        const { name, collectDay, branchId } = req.body;

        // Check if the branch exists
        const branch = await Branch.findById(branchId);
        if (!branch) return res.status(404).json({ message: "Branch not found" });

        const centerData = {
            name,
            collectDay,
            branch: branchId,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const center = new Center(centerData);
        const savedCenter = await center.save();
        res.status(201).json(savedCenter);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all centers
exports.getCenters = async (req, res) => {
    try {
        const centers = await Center.find().populate('branch', 'name code'); // Populating branch info
        res.status(200).json(centers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single center by ID
exports.getCenterById = async (req, res) => {
    try {
        const center = await Center.findById(req.params.id).populate('branch', 'name code');
        if (!center) return res.status(404).json({ message: "Center not found" });
        res.status(200).json(center);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a center by ID
exports.updateCenter = async (req, res) => {
    try {
        const { name, collectDay, branchId } = req.body;

        // Check if the branch exists
        const branch = await Branch.findById(branchId);
        if (!branch) return res.status(404).json({ message: "Branch not found" });

        const center = await Center.findByIdAndUpdate(req.params.id, {
            name,
            collectDay,
            branch: branchId,
            updatedAt: new Date()
        }, { new: true });

        if (!center) return res.status(404).json({ message: "Center not found" });
        res.status(200).json(center);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a center by ID
exports.deleteCenter = async (req, res) => {
    try {
        const center = await Center.findByIdAndDelete(req.params.id);
        if (!center) return res.status(404).json({ message: "Center not found" });
        res.status(204).json({ message: "Center deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

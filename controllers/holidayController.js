const Holiday = require('../models/Holiday');
const Center = require('../models/Center');
const Branch = require('../models/Branch');
const Product = require('../models/Product');

// Create a new holiday
exports.createHoliday = async (req, res) => {
    try {
        const { name, date, description, centerId, branchId, productId } = req.body;

        // Validate center exists
        const center = await Center.findById(centerId);
        if (!center) {
            return res.status(404).json({ message: "Center not found" });
        }

        // Validate branch exists
        const branch = await Branch.findById(branchId);
        if (!branch) {
            return res.status(404).json({ message: "Branch not found" });
        }

        // Validate product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // createdBy removed from public creation flow

        // Check if holiday already exists for this center, product and date
        const existingHoliday = await Holiday.findOne({
            centerId,
            productId,
            date: new Date(date),
            isActive: true
        });

        if (existingHoliday) {
            return res.status(400).json({ message: "Holiday already exists for this center, product and date" });
        }

        const holiday = new Holiday({
            name,
            date: new Date(date),
            description,
            centerId,
            branchId,
            productId
        });

        const savedHoliday = await holiday.save();
        
        // Populate references for response
        const populatedHoliday = await Holiday.findById(savedHoliday._id)
            .populate('centerId', 'name')
            .populate('branchId', 'name')
            .populate('productId', 'name type');

        res.status(201).json(populatedHoliday);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all holidays for a specific center
exports.getHolidaysByCenter = async (req, res) => {
    try {
        const { centerId } = req.params;
        const { year, productId } = req.query;

        let query = { centerId, isActive: true };
        
        if (year) {
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31);
            query.date = { $gte: startDate, $lte: endDate };
        }

        if (productId) {
            query.productId = productId;
        }

        const holidays = await Holiday.find(query)
            .populate('centerId', 'name')
            .populate('branchId', 'name')
            .populate('productId', 'name type')
            .sort({ date: 1 });

        res.status(200).json(holidays);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all holidays for a specific branch
exports.getHolidaysByBranch = async (req, res) => {
    try {
        const { branchId } = req.params;
        const { year, productId } = req.query;

        let query = { branchId, isActive: true };
        
        if (year) {
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31);
            query.date = { $gte: startDate, $lte: endDate };
        }

        if (productId) {
            query.productId = productId;
        }

        const holidays = await Holiday.find(query)
            .populate('centerId', 'name')
            .populate('branchId', 'name')
            .populate('productId', 'name type')
            .sort({ date: 1 });

        res.status(200).json(holidays);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all holidays
exports.getAllHolidays = async (req, res) => {
    try {
        const { year, centerId, branchId, productId } = req.query;

        let query = { isActive: true };
        
        if (year) {
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31);
            query.date = { $gte: startDate, $lte: endDate };
        }

        if (centerId) {
            query.centerId = centerId;
        }

        if (branchId) {
            query.branchId = branchId;
        }

        if (productId) {
            query.productId = productId;
        }

        const holidays = await Holiday.find(query)
            .populate('centerId', 'name')
            .populate('branchId', 'name')
            .populate('productId', 'name type')
            .sort({ date: 1 });

        res.status(200).json(holidays);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single holiday by ID
exports.getHolidayById = async (req, res) => {
    try {
        const holiday = await Holiday.findById(req.params.id)
            .populate('centerId', 'name')
            .populate('branchId', 'name');

        if (!holiday) {
            return res.status(404).json({ message: "Holiday not found" });
        }

        res.status(200).json(holiday);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a holiday
exports.updateHoliday = async (req, res) => {
    try {
        const { name, date, description, centerId, branchId } = req.body;

        // Check if holiday exists
        const existingHoliday = await Holiday.findById(req.params.id);
        if (!existingHoliday) {
            return res.status(404).json({ message: "Holiday not found" });
        }

        // If date is being changed, check for conflicts
        if (date && new Date(date).getTime() !== existingHoliday.date.getTime()) {
            const conflictHoliday = await Holiday.findOne({
                centerId: centerId || existingHoliday.centerId,
                date: new Date(date),
                isActive: true,
                _id: { $ne: req.params.id }
            });

            if (conflictHoliday) {
                return res.status(400).json({ message: "Holiday already exists for this center and date" });
            }
        }

        const updatedHoliday = await Holiday.findByIdAndUpdate(
            req.params.id,
            {
                name,
                date: date ? new Date(date) : existingHoliday.date,
                description,
                centerId,
                branchId,
                updatedAt: new Date()
            },
            { new: true }
        ).populate('centerId', 'name')
         .populate('branchId', 'name');

        res.status(200).json(updatedHoliday);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a holiday (soft delete)
exports.deleteHoliday = async (req, res) => {
    try {
        const holiday = await Holiday.findByIdAndUpdate(
            req.params.id,
            { isActive: false, updatedAt: new Date() },
            { new: true }
        );

        if (!holiday) {
            return res.status(404).json({ message: "Holiday not found" });
        }

        res.status(200).json({ message: "Holiday deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all holidays for a specific product
exports.getHolidaysByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const { year, centerId } = req.query;

        let query = { productId, isActive: true };
        
        if (year) {
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31);
            query.date = { $gte: startDate, $lte: endDate };
        }

        if (centerId) {
            query.centerId = centerId;
        }

        const holidays = await Holiday.find(query)
            .populate('centerId', 'name')
            .populate('branchId', 'name')
            .populate('productId', 'name type')
            .sort({ date: 1 });

        res.status(200).json(holidays);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Check if a specific date is a holiday for a center and product
exports.checkHoliday = async (req, res) => {
    try {
        const { centerId, productId, date } = req.params;
        
        const holiday = await Holiday.findOne({
            centerId,
            productId,
            date: new Date(date),
            isActive: true
        }).populate('productId', 'name type');

        if (holiday) {
            res.status(200).json({ 
                isHoliday: true, 
                holiday: holiday 
            });
        } else {
            res.status(200).json({ 
                isHoliday: false, 
                holiday: null 
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 
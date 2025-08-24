const Holiday = require("../models/Holiday");
const Center = require("../models/Center");
const Branch = require("../models/Branch");
const Product = require("../models/Product");

class HolidayService {
    /**
     * Create a new holiday
     * @param {Object} holidayData - Holiday data
     * @returns {Promise<Object>} Created holiday
     */
    static async createHoliday(holidayData) {
        const { name, date, description, centerId, branchId, productId } = holidayData;

        // Validate required fields
        if (!name || !date || !centerId || !branchId || !productId) {
            throw new Error("Name, date, center, branch, and product are required");
        }

        // Validate center exists
        const center = await Center.findById(centerId);
        if (!center) {
            throw new Error("Center not found");
        }

        // Validate branch exists
        const branch = await Branch.findById(branchId);
        if (!branch) {
            throw new Error("Branch not found");
        }

        // Validate product exists
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error("Product not found");
        }

        // Check if holiday already exists for this center, product and date
        const existingHoliday = await Holiday.findOne({
            centerId,
            productId,
            date: new Date(date),
            isActive: true
        });

        if (existingHoliday) {
            throw new Error("Holiday already exists for this center, product and date");
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
        
        // Return populated holiday
        return await Holiday.findById(savedHoliday._id)
            .populate('centerId', 'name')
            .populate('branchId', 'name')
            .populate('productId', 'name type');
    }

    /**
     * Get all holidays with filters
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} List of holidays
     */
    static async getAllHolidays(filters = {}) {
        const query = { isActive: true };

        // Apply filters
        if (filters.centerId) {
            query.centerId = filters.centerId;
        }
        if (filters.branchId) {
            query.branchId = filters.branchId;
        }
        if (filters.productId) {
            query.productId = filters.productId;
        }
        if (filters.year) {
            const startDate = new Date(filters.year, 0, 1);
            const endDate = new Date(filters.year, 11, 31);
            query.date = { $gte: startDate, $lte: endDate };
        }
        if (filters.startDate && filters.endDate) {
            query.date = {
                $gte: new Date(filters.startDate),
                $lte: new Date(filters.endDate)
            };
        }

        return await Holiday.find(query)
            .populate('centerId', 'name')
            .populate('branchId', 'name')
            .populate('productId', 'name type')
            .sort({ date: 1 });
    }

    /**
     * Get holidays by center
     * @param {string} centerId - Center ID
     * @param {Object} filters - Additional filters
     * @returns {Promise<Array>} List of holidays
     */
    static async getHolidaysByCenter(centerId, filters = {}) {
        return await this.getAllHolidays({ ...filters, centerId });
    }

    /**
     * Get holidays by branch
     * @param {string} branchId - Branch ID
     * @param {Object} filters - Additional filters
     * @returns {Promise<Array>} List of holidays
     */
    static async getHolidaysByBranch(branchId, filters = {}) {
        return await this.getAllHolidays({ ...filters, branchId });
    }

    /**
     * Get holiday by ID
     * @param {string} holidayId - Holiday ID
     * @returns {Promise<Object>} Holiday object
     */
    static async getHolidayById(holidayId) {
        const holiday = await Holiday.findById(holidayId)
            .populate('centerId', 'name location')
            .populate('branchId', 'name address')
            .populate('productId', 'name type');
        
        if (!holiday) {
            throw new Error("Holiday not found");
        }
        return holiday;
    }

    /**
     * Update holiday by ID
     * @param {string} holidayId - Holiday ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated holiday
     */
    static async updateHoliday(holidayId, updateData) {
        // If updating date, check for conflicts
        if (updateData.date) {
            const holiday = await Holiday.findById(holidayId);
            if (!holiday) {
                throw new Error("Holiday not found");
            }

            const existingHoliday = await Holiday.findOne({
                centerId: holiday.centerId,
                productId: holiday.productId,
                date: new Date(updateData.date),
                isActive: true,
                _id: { $ne: holidayId }
            });

            if (existingHoliday) {
                throw new Error("Holiday already exists for this center, product and date");
            }
        }

        const holiday = await Holiday.findByIdAndUpdate(holidayId, {
            ...updateData,
            updatedAt: new Date()
        }, { new: true })
            .populate('centerId', 'name')
            .populate('branchId', 'name')
            .populate('productId', 'name type');
        
        if (!holiday) {
            throw new Error("Holiday not found");
        }
        return holiday;
    }

    /**
     * Delete holiday by ID (soft delete)
     * @param {string} holidayId - Holiday ID
     * @returns {Promise<Object>} Updated holiday
     */
    static async deleteHoliday(holidayId) {
        const holiday = await Holiday.findByIdAndUpdate(holidayId, {
            isActive: false,
            updatedAt: new Date()
        }, { new: true });
        
        if (!holiday) {
            throw new Error("Holiday not found");
        }
        return holiday;
    }

    /**
     * Get holidays in date range for specific center and product
     * @param {string} centerId - Center ID
     * @param {string} productId - Product ID
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Promise<Array>} List of holidays
     */
    static async getHolidaysInRange(centerId, productId, startDate, endDate) {
        return await Holiday.find({
            centerId,
            productId,
            isActive: true,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });
    }

    /**
     * Count holidays in date range
     * @param {string} centerId - Center ID
     * @param {string} productId - Product ID
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Promise<number>} Holiday count
     */
    static async countHolidaysInRange(centerId, productId, startDate, endDate) {
        return await Holiday.countDocuments({
            centerId,
            productId,
            isActive: true,
            date: { $gte: startDate, $lte: endDate }
        });
    }

    /**
     * Get upcoming holidays
     * @param {string} centerId - Center ID (optional)
     * @param {number} days - Number of days ahead (default 30)
     * @returns {Promise<Array>} List of upcoming holidays
     */
    static async getUpcomingHolidays(centerId = null, days = 30) {
        const today = new Date();
        const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

        const query = {
            isActive: true,
            date: { $gte: today, $lte: futureDate }
        };

        if (centerId) {
            query.centerId = centerId;
        }

        return await Holiday.find(query)
            .populate('centerId', 'name')
            .populate('branchId', 'name')
            .populate('productId', 'name type')
            .sort({ date: 1 });
    }

    /**
     * Get holiday statistics
     * @returns {Promise<Object>} Holiday statistics
     */
    static async getHolidayStatistics() {
        const totalHolidays = await Holiday.countDocuments({ isActive: true });
        const currentYear = new Date().getFullYear();
        
        const thisYearHolidays = await Holiday.countDocuments({
            isActive: true,
            date: {
                $gte: new Date(currentYear, 0, 1),
                $lte: new Date(currentYear, 11, 31)
            }
        });

        const upcomingHolidays = await Holiday.countDocuments({
            isActive: true,
            date: { $gte: new Date() }
        });

        // Holidays by center
        const holidaysByCenter = await Holiday.aggregate([
            { $match: { isActive: true } },
            {
                $lookup: {
                    from: "centers",
                    localField: "centerId",
                    foreignField: "_id",
                    as: "center"
                }
            },
            { $unwind: "$center" },
            {
                $group: {
                    _id: "$center.name",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Holidays by month (current year)
        const holidaysByMonth = await Holiday.aggregate([
            {
                $match: {
                    isActive: true,
                    date: {
                        $gte: new Date(currentYear, 0, 1),
                        $lte: new Date(currentYear, 11, 31)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$date" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        return {
            totalHolidays,
            thisYearHolidays,
            upcomingHolidays,
            holidaysByCenter,
            holidaysByMonth
        };
    }

    /**
     * Validate holiday data
     * @param {Object} holidayData - Holiday data to validate
     * @returns {Array} Array of validation errors
     */
    static validateHolidayData(holidayData) {
        const errors = [];

        // Name validation
        if (!holidayData.name || holidayData.name.trim().length === 0) {
            errors.push("Holiday name is required");
        }

        // Date validation
        if (!holidayData.date) {
            errors.push("Holiday date is required");
        } else {
            const date = new Date(holidayData.date);
            if (isNaN(date.getTime())) {
                errors.push("Invalid holiday date");
            }
        }

        // Center ID validation
        if (!holidayData.centerId) {
            errors.push("Center ID is required");
        }

        // Branch ID validation
        if (!holidayData.branchId) {
            errors.push("Branch ID is required");
        }

        // Product ID validation
        if (!holidayData.productId) {
            errors.push("Product ID is required");
        }

        return errors;
    }

    /**
     * Check if date is a holiday
     * @param {Date} date - Date to check
     * @param {string} centerId - Center ID
     * @param {string} productId - Product ID
     * @returns {Promise<boolean>} True if date is a holiday
     */
    static async isHoliday(date, centerId, productId) {
        const count = await Holiday.countDocuments({
            centerId,
            productId,
            isActive: true,
            date: {
                $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
            }
        });

        return count > 0;
    }

    /**
     * Get business days between two dates (excluding holidays)
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @param {string} centerId - Center ID
     * @param {string} productId - Product ID
     * @returns {Promise<number>} Number of business days
     */
    static async getBusinessDaysBetween(startDate, endDate, centerId, productId) {
        const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
        const holidayCount = await this.countHolidaysInRange(centerId, productId, startDate, endDate);
        
        return Math.max(totalDays - holidayCount, 0);
    }
}

module.exports = HolidayService;

/**
 * HOLIDAY CONTROLLER
 * 
 * HTTP request/response handler for holiday management operations.
 * Uses HolidayService for business logic and validation.
 */

const HolidayService = require('../services/holidayService');

/**
 * Create a new holiday
 * POST /api/holidays
 */
exports.createHoliday = async (req, res) => {
    try {
        const holiday = await HolidayService.createHoliday(req.body);
        res.status(201).json({
            success: true,
            data: holiday,
            message: 'Holiday created successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get all holidays for a specific center
 * GET /api/holidays/center/:centerId
 */
exports.getHolidaysByCenter = async (req, res) => {
    try {
        const holidays = await HolidayService.getHolidaysByCenter(req.params.centerId, req.query);
        res.status(200).json({
            success: true,
            data: holidays,
            message: 'Holidays retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get all holidays for a specific branch
 * GET /api/holidays/branch/:branchId
 */
exports.getHolidaysByBranch = async (req, res) => {
    try {
        const holidays = await HolidayService.getHolidaysByBranch(req.params.branchId, req.query);
        res.status(200).json({
            success: true,
            data: holidays,
            message: 'Holidays retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get all holidays
 * GET /api/holidays
 */
exports.getAllHolidays = async (req, res) => {
    try {
        const holidays = await HolidayService.getAllHolidays(req.query);
        res.status(200).json({
            success: true,
            data: holidays,
            message: 'Holidays retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get a single holiday by ID
 * GET /api/holidays/:id
 */
exports.getHolidayById = async (req, res) => {
    try {
        const holiday = await HolidayService.getHolidayById(req.params.id);
        res.status(200).json({
            success: true,
            data: holiday,
            message: 'Holiday retrieved successfully'
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Update a holiday
 * PUT /api/holidays/:id
 */
exports.updateHoliday = async (req, res) => {
    try {
        const holiday = await HolidayService.updateHoliday(req.params.id, req.body);
        res.status(200).json({
            success: true,
            data: holiday,
            message: 'Holiday updated successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Delete a holiday (soft delete)
 * DELETE /api/holidays/:id
 */
exports.deleteHoliday = async (req, res) => {
    try {
        await HolidayService.deleteHoliday(req.params.id);
        res.status(200).json({
            success: true,
            message: 'Holiday deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get all holidays for a specific product
 * GET /api/holidays/product/:productId
 */
exports.getHolidaysByProduct = async (req, res) => {
    try {
        const holidays = await HolidayService.getHolidaysByProduct(req.params.productId, req.query);
        res.status(200).json({
            success: true,
            data: holidays,
            message: 'Holidays retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Check if a specific date is a holiday for a center and product
 * GET /api/holidays/check/:centerId/:productId/:date
 */
exports.checkHoliday = async (req, res) => {
    try {
        const result = await HolidayService.checkHoliday(
            req.params.centerId, 
            req.params.productId, 
            req.params.date
        );
        res.status(200).json({
            success: true,
            data: result,
            message: 'Holiday check completed'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 
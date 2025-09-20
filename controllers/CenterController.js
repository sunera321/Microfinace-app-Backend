/**
 * CENTER CONTROLLER
 * 
 * HTTP request/response handler for center management operations.
 * Uses CenterService for business logic and validation.
 */

const CenterService = require('../services/centerService');

/**
 * Create a new center
 * POST /api/centers
 */
exports.createCenter = async (req, res) => {
    try {
        const center = await CenterService.createCenter(req.body);
        res.status(201).json({
            success: true,
            data: center,
            message: 'Center created successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get all centers
 * GET /api/centers
 */
exports.getCenters = async (req, res) => {
    try {
        const centers = await CenterService.getAllCenters(req.query);
        res.status(200).json({
            success: true,
            data: centers,
            message: 'Centers retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get a single center by ID
 * GET /api/centers/:id
 */
exports.getCenterById = async (req, res) => {
    try {
        const center = await CenterService.getCenterById(req.params.id);
        res.status(200).json({
            success: true,
            data: center,
            message: 'Center retrieved successfully'
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Update a center by ID
 * PUT /api/centers/:id
 */
exports.updateCenter = async (req, res) => {
    try {
        const center = await CenterService.updateCenter(req.params.id, req.body);
        res.status(200).json({
            success: true,
            data: center,
            message: 'Center updated successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Delete a center by ID
 * DELETE /api/centers/:id
 */
exports.deleteCenter = async (req, res) => {
    try {
        await CenterService.deleteCenter(req.params.id);
        res.status(200).json({
            success: true,
            message: 'Center deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

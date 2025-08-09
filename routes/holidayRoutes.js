const express = require('express');
const router = express.Router();
const holidayController = require('../controllers/holidayController');
const adminAuth = require('../middleware/adminAuth');

// Create a new holiday (no admin required)
router.post('/', holidayController.createHoliday);

// Get all holidays (with optional filters)
router.get('/', holidayController.getAllHolidays);

// Get holidays by center
router.get('/center/:centerId', holidayController.getHolidaysByCenter);

// Get holidays by branch
router.get('/branch/:branchId', holidayController.getHolidaysByBranch);

// Get holidays by product
router.get('/product/:productId', holidayController.getHolidaysByProduct);

// Check if a specific date is a holiday for a center and product
router.get('/check/:centerId/:productId/:date', holidayController.checkHoliday);

// Get a single holiday by ID
router.get('/:id', holidayController.getHolidayById);

// Update a holiday (admin only)
router.put('/:id', adminAuth, holidayController.updateHoliday);

// Delete a holiday (admin only)
router.delete('/:id', adminAuth, holidayController.deleteHoliday);

module.exports = router; 
const express = require('express');
const router = express.Router();
const interestController = require('../controllers/interestController');

// Calculate interest for a specific loan
router.post('/calculate', interestController.calculateInterest);

// Calculate interest for multiple loans
router.post('/calculate-multiple', interestController.calculateInterestForMultipleLoans);

// Check if a specific date is a holiday for a center and product
router.get('/check-holiday/:centerId/:productId/:date', interestController.checkHoliday);

// Get holidays for a center and product within a date range
router.get('/holidays/:centerId/:productId', interestController.getHolidaysInRange);

// Calculate interest for all loans in a center
router.get('/calculate-center/:centerId', interestController.calculateInterestForCenter);

module.exports = router; 
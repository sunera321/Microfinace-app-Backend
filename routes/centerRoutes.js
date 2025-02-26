const express = require('express');
const router = express.Router();
const centerController = require('../controllers/CenterController');

// POST /centers - Create a new center
router.post('/', centerController.createCenter);

// GET /centers - Get all centers
router.get('/', centerController.getCenters);

// GET /centers/:id - Get a single center by ID
router.get('/:id', centerController.getCenterById);

// PUT /centers/:id - Update a center by ID
router.put('/:id', centerController.updateCenter);

// DELETE /centers/:id - Delete a center by ID
router.delete('/:id', centerController.deleteCenter);

module.exports = router;

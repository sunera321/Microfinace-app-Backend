const express = require('express');
const router = express.Router();
const branchController = require('../controllers/BranchController');

// POST /branches - Create a new branch
router.post('/', branchController.createbranch);

// GET /branches - Get all branches
router.get('/', branchController.getAllBranchs);

// GET /branches/:id - Get a single branch by ID
router.get('/:id', branchController.getBranchById);

// PUT /branches/:id - Update a branch by ID
router.put('/:id', branchController.updateBranch);

// DELETE /branches/:id - Delete a branch by ID
router.delete('/:id', branchController.deleteBranch);

module.exports = router;

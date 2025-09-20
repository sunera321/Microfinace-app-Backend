/**
 * CUSTOMER ROUTES
 * 
 * Defines API endpoints for customer management operations.
 * Handles CRUD operations for customer records including:
 * - Customer registration and profile management
 * - Contact information updates
 * - Association with centers and branches
 */

const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");

/**
 * CUSTOMER CRUD OPERATIONS
 * RESTful API endpoints for complete customer lifecycle management
 */

// POST /customers - Register a new customer
router.post("/", customerController.createCustomer);

// GET /customers - Retrieve all customers with center/branch details
router.get("/", customerController.getCustomers);

// GET /customers/:id - Get specific customer by ID
router.get("/:id", customerController.getCustomerById);

// PUT /customers/:id - Update customer information
router.put("/:id", customerController.updateCustomer);

// DELETE /customers/:id - Remove customer (use with caution - check for active loans)
router.delete("/:id", customerController.deleteCustomer);

module.exports = router;

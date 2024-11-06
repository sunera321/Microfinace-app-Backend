const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");

// POST /customers - Create a new customer
router.post("/", customerController.createCustomer);

// GET /customers - Get all customers
router.get("/", customerController.getCustomers);

// GET /customers/:id - Get a single customer by ID
router.get("/:id", customerController.getCustomerById);

// PUT /customers/:id - Update a customer by ID
router.put("/:id", customerController.updateCustomer);

// DELETE /customers/:id - Delete a customer by ID
router.delete("/:id", customerController.deleteCustomer);

module.exports = router;

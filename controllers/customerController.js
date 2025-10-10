/**
 * CUSTOMER CONTROLLER
 * 
 * Handles all customer-related operations for the microfinance system.
 * Customers are the primary borrowers who apply for loans and make repayments.
 * Each customer belongs to a center and branch for organizational purposes.
 */

const Customer = require("../models/Customer");

/**
 * CREATE CUSTOMER
 * Register a new customer in the system
 * @param {Object} req.body - Customer data (firstName, lastName, email, phone, address, NIC_no, dateOfBirth, centerId, branchId)
 * @returns {Object} 201 - Created customer object
 * @returns {Object} 400 - Validation error
 */
exports.createCustomer = async (req, res) => {
    try {
        const { 
            firstName, 
            lastName, 
            email, 
            phone, 
            address, 
            NIC_no, 
            dateOfBirth, 
            centerId, 
            branchId,
            gender,
            maritalStatus,
            occupation,
            employer,
            monthlyIncome,
            dependents
        } = req.body;

        const customer = new Customer({
            firstName,
            lastName,
            email,
            phone,
            address,
            NIC_no,
            dateOfBirth,
            centerId,
            branchId,
            gender,
            maritalStatus,
            occupation,
            employer,
            monthlyIncome: monthlyIncome ? Number(monthlyIncome) : 0,
            dependents: dependents ? Number(dependents) : 0,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const savedCustomer = await customer.save();
        res.status(201).json(savedCustomer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * GET ALL CUSTOMERS
 * Retrieve complete list of customers with center and branch details
 * @returns {Array} 200 - List of customers with populated center/branch data
 * @returns {Object} 500 - Server error
 */
exports.getCustomers = async (req, res) => {
    try {
        const customers = await Customer.find().populate("centerId branchId");
        res.status(200).json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET CUSTOMER BY ID
 * Retrieve a specific customer with center and branch details
 * @param {String} req.params.id - Customer ID
 * @returns {Object} 200 - Customer object with populated data
 * @returns {Object} 404 - Customer not found
 * @returns {Object} 500 - Server error
 */
exports.getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id).populate("centerId branchId");
        if (!customer) return res.status(404).json({ message: "Customer not found" });
        res.status(200).json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * UPDATE CUSTOMER
 * Modify existing customer information
 * @param {String} req.params.id - Customer ID
 * @param {Object} req.body - Updated customer data
 * @returns {Object} 200 - Updated customer object
 * @returns {Object} 404 - Customer not found
 * @returns {Object} 400 - Validation error
 */
exports.updateCustomer = async (req, res) => {
    try {
        // Update updatedAt timestamp
        req.body.updatedAt = new Date();
        
        // Ensure numeric fields are properly converted
        if (req.body.monthlyIncome !== undefined) {
            req.body.monthlyIncome = Number(req.body.monthlyIncome) || 0;
        }
        if (req.body.dependents !== undefined) {
            req.body.dependents = Number(req.body.dependents) || 0;
        }

        const updatedCustomer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("centerId branchId");
        if (!updatedCustomer) return res.status(404).json({ message: "Customer not found" });
        res.status(200).json(updatedCustomer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * DELETE CUSTOMER
 * Remove a customer from the system
 * Note: This should only be used if the customer has no active loans
 * @param {String} req.params.id - Customer ID
 * @returns {Object} 204 - Success message
 * @returns {Object} 404 - Customer not found
 * @returns {Object} 500 - Server error
 */
exports.deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);
        if (!customer) return res.status(404).json({ message: "Customer not found" });
        res.status(204).json({ message: "Customer deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

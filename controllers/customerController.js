const Customer = require("../models/Customer");

// Create a new customer
exports.createCustomer = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, address, NIC_no, dateOfBirth, centerId, branchId } = req.body;

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
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const savedCustomer = await customer.save();
        res.status(201).json(savedCustomer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all customers
exports.getCustomers = async (req, res) => {
    try {
        const customers = await Customer.find().populate("centerId branchId");
        res.status(200).json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single customer by ID
exports.getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id).populate("centerId branchId");
        if (!customer) return res.status(404).json({ message: "Customer not found" });
        res.status(200).json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a customer by ID
exports.updateCustomer = async (req, res) => {
    try {
        const updatedCustomer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("centerId branchId");
        if (!updatedCustomer) return res.status(404).json({ message: "Customer not found" });
        res.status(200).json(updatedCustomer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a customer by ID
exports.deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);
        if (!customer) return res.status(404).json({ message: "Customer not found" });
        res.status(204).json({ message: "Customer deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

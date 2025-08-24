const Customer = require("../models/Customer");

class CustomerService {
    /**
     * Create a new customer
     * @param {Object} customerData - Customer data
     * @returns {Promise<Object>} Created customer
     */
    static async createCustomer(customerData) {
        const { firstName, lastName, email, phone, address, NIC_no, dateOfBirth, centerId, branchId } = customerData;

        // Validate required fields
        if (!firstName || !lastName || !email || !NIC_no || !centerId || !branchId) {
            throw new Error("First name, last name, email, NIC number, center ID, and branch ID are required");
        }

        const customer = new Customer({
            firstName,
            lastName,
            email: email.toLowerCase(),
            phone,
            address,
            NIC_no,
            dateOfBirth,
            centerId,
            branchId,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return await customer.save();
    }

    /**
     * Get all customers with populated relationships
     * @returns {Promise<Array>} List of customers
     */
    static async getAllCustomers() {
        return await Customer.find()
            .populate("centerId", "name location")
            .populate("branchId", "name address")
            .sort({ createdAt: -1 });
    }

    /**
     * Get customer by ID with populated relationships
     * @param {string} customerId - Customer ID
     * @returns {Promise<Object>} Customer object
     */
    static async getCustomerById(customerId) {
        const customer = await Customer.findById(customerId)
            .populate("centerId", "name location")
            .populate("branchId", "name address");
        
        if (!customer) {
            throw new Error("Customer not found");
        }
        return customer;
    }

    /**
     * Update customer by ID
     * @param {string} customerId - Customer ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated customer
     */
    static async updateCustomer(customerId, updateData) {
        const customer = await Customer.findByIdAndUpdate(customerId, {
            ...updateData,
            updatedAt: new Date()
        }, { new: true })
            .populate("centerId", "name location")
            .populate("branchId", "name address");
        
        if (!customer) {
            throw new Error("Customer not found");
        }
        return customer;
    }

    /**
     * Delete customer by ID
     * @param {string} customerId - Customer ID
     * @returns {Promise<Object>} Deleted customer
     */
    static async deleteCustomer(customerId) {
        const customer = await Customer.findByIdAndDelete(customerId);
        if (!customer) {
            throw new Error("Customer not found");
        }
        return customer;
    }

    /**
     * Get customers by center ID
     * @param {string} centerId - Center ID
     * @returns {Promise<Array>} List of customers
     */
    static async getCustomersByCenter(centerId) {
        return await Customer.find({ centerId })
            .populate("centerId", "name location")
            .populate("branchId", "name address")
            .sort({ lastName: 1, firstName: 1 });
    }

    /**
     * Get customers by branch ID
     * @param {string} branchId - Branch ID
     * @returns {Promise<Array>} List of customers
     */
    static async getCustomersByBranch(branchId) {
        return await Customer.find({ branchId })
            .populate("centerId", "name location")
            .populate("branchId", "name address")
            .sort({ lastName: 1, firstName: 1 });
    }

    /**
     * Search customers by name or NIC
     * @param {string} searchTerm - Search term
     * @returns {Promise<Array>} List of matching customers
     */
    static async searchCustomers(searchTerm) {
        const searchRegex = new RegExp(searchTerm, 'i'); // Case-insensitive search
        
        return await Customer.find({
            $or: [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { NIC_no: searchRegex },
                { email: searchRegex }
            ]
        })
            .populate("centerId", "name location")
            .populate("branchId", "name address")
            .sort({ lastName: 1, firstName: 1 });
    }

    /**
     * Get customer by NIC number
     * @param {string} nicNo - NIC number
     * @returns {Promise<Object>} Customer object
     */
    static async getCustomerByNIC(nicNo) {
        const customer = await Customer.findOne({ NIC_no: nicNo })
            .populate("centerId", "name location")
            .populate("branchId", "name address");
        
        if (!customer) {
            throw new Error("Customer not found with this NIC number");
        }
        return customer;
    }

    /**
     * Check if customer exists by email
     * @param {string} email - Email address
     * @returns {Promise<boolean>} True if exists
     */
    static async customerExistsByEmail(email) {
        const customer = await Customer.findOne({ email: email.toLowerCase() });
        return !!customer;
    }

    /**
     * Check if customer exists by NIC
     * @param {string} nicNo - NIC number
     * @returns {Promise<boolean>} True if exists
     */
    static async customerExistsByNIC(nicNo) {
        const customer = await Customer.findOne({ NIC_no: nicNo });
        return !!customer;
    }

    /**
     * Get customer statistics
     * @returns {Promise<Object>} Customer statistics
     */
    static async getCustomerStatistics() {
        const totalCustomers = await Customer.countDocuments();
        const recentCustomers = await Customer.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        });

        const customersByBranch = await Customer.aggregate([
            {
                $group: {
                    _id: "$branchId",
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "branches",
                    localField: "_id",
                    foreignField: "_id",
                    as: "branch"
                }
            },
            {
                $unwind: "$branch"
            },
            {
                $project: {
                    branchName: "$branch.name",
                    count: 1
                }
            }
        ]);

        return {
            totalCustomers,
            recentCustomers,
            customersByBranch
        };
    }
}

module.exports = CustomerService;

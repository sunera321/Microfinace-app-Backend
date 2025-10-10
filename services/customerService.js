const Customer = require("../models/Customer");

class CustomerService {
    /**
     * Create a new customer
     * @param {Object} customerData - Customer data
     * @returns {Promise<Object>} Created customer
     */
    static async createCustomer(customerData) {
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
        } = customerData;

        // Validate required fields
        if (!firstName || !lastName || !email || !NIC_no || !centerId || !branchId) {
            throw new Error("First name, last name, email, NIC number, center ID, and branch ID are required");
        }

        // Validate numeric fields
        if (monthlyIncome !== null && monthlyIncome !== undefined && isNaN(parseFloat(monthlyIncome))) {
            throw new Error("Monthly income must be a valid number");
        }

        if (dependents !== null && dependents !== undefined && (isNaN(parseInt(dependents)) || parseInt(dependents) < 0)) {
            throw new Error("Number of dependents must be a valid non-negative integer");
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
            gender,
            maritalStatus,
            occupation,
            employer,
            monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null,
            dependents: dependents !== null && dependents !== undefined ? parseInt(dependents) : null,
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
        // Validate and process numeric fields if they are being updated
        if (updateData.monthlyIncome !== undefined && updateData.monthlyIncome !== null) {
            if (isNaN(parseFloat(updateData.monthlyIncome))) {
                throw new Error("Monthly income must be a valid number");
            }
            updateData.monthlyIncome = parseFloat(updateData.monthlyIncome);
        }

        if (updateData.dependents !== undefined && updateData.dependents !== null) {
            if (isNaN(parseInt(updateData.dependents)) || parseInt(updateData.dependents) < 0) {
                throw new Error("Number of dependents must be a valid non-negative integer");
            }
            updateData.dependents = parseInt(updateData.dependents);
        }

        // Normalize email if provided
        if (updateData.email) {
            updateData.email = updateData.email.toLowerCase();
        }

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
     * Search customers by multiple fields
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
                { email: searchRegex },
                { gender: searchRegex },
                { maritalStatus: searchRegex },
                { occupation: searchRegex },
                { employer: searchRegex },
                { 'address.street': searchRegex },
                { 'address.city': searchRegex },
                { 'address.province': searchRegex }
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

        // Gender distribution
        const genderDistribution = await Customer.aggregate([
            {
                $group: {
                    _id: "$gender",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    gender: "$_id",
                    count: 1,
                    _id: 0
                }
            }
        ]);

        // Marital status distribution
        const maritalStatusDistribution = await Customer.aggregate([
            {
                $group: {
                    _id: "$maritalStatus",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    maritalStatus: "$_id",
                    count: 1,
                    _id: 0
                }
            }
        ]);

        // Average monthly income
        const incomeStats = await Customer.aggregate([
            {
                $match: {
                    monthlyIncome: { $ne: null, $gt: 0 }
                }
            },
            {
                $group: {
                    _id: null,
                    averageIncome: { $avg: "$monthlyIncome" },
                    maxIncome: { $max: "$monthlyIncome" },
                    minIncome: { $min: "$monthlyIncome" },
                    totalCustomersWithIncome: { $sum: 1 }
                }
            }
        ]);

        return {
            totalCustomers,
            recentCustomers,
            customersByBranch,
            genderDistribution,
            maritalStatusDistribution,
            incomeStats: incomeStats[0] || {
                averageIncome: 0,
                maxIncome: 0,
                minIncome: 0,
                totalCustomersWithIncome: 0
            }
        };
    }

    /**
     * Get customers by income range
     * @param {number} minIncome - Minimum income
     * @param {number} maxIncome - Maximum income
     * @returns {Promise<Array>} List of customers in income range
     */
    static async getCustomersByIncomeRange(minIncome, maxIncome) {
        const query = {
            monthlyIncome: {
                $gte: minIncome,
                $lte: maxIncome,
                $ne: null
            }
        };

        return await Customer.find(query)
            .populate("centerId", "name location")
            .populate("branchId", "name address")
            .sort({ monthlyIncome: -1 });
    }

    /**
     * Get customers by occupation
     * @param {string} occupation - Occupation
     * @returns {Promise<Array>} List of customers with specified occupation
     */
    static async getCustomersByOccupation(occupation) {
        const occupationRegex = new RegExp(occupation, 'i');
        
        return await Customer.find({ occupation: occupationRegex })
            .populate("centerId", "name location")
            .populate("branchId", "name address")
            .sort({ lastName: 1, firstName: 1 });
    }

    /**
     * Get customers by employer
     * @param {string} employer - Employer name
     * @returns {Promise<Array>} List of customers with specified employer
     */
    static async getCustomersByEmployer(employer) {
        const employerRegex = new RegExp(employer, 'i');
        
        return await Customer.find({ employer: employerRegex })
            .populate("centerId", "name location")
            .populate("branchId", "name address")
            .sort({ lastName: 1, firstName: 1 });
    }
}

module.exports = CustomerService;

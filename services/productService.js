const Product = require("../models/Product");

class ProductService {
    /**
     * Create a new product
     * @param {Object} productData - Product data
     * @returns {Promise<Object>} Created product
     */
    static async createProduct(productData) {
        // Validate required fields
        if (!productData.name || !productData.type) {
            throw new Error("Product name and type are required");
        }

        const product = new Product({
            ...productData,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return await product.save();
    }

    /**
     * Get all products
     * @param {Object} filters - Optional filters
     * @returns {Promise<Array>} List of products
     */
    static async getAllProducts(filters = {}) {
        const query = {};

        // Apply filters if provided
        if (filters.type) {
            query.type = filters.type;
        }
        if (filters.isActive !== undefined) {
            query.isActive = filters.isActive;
        }
        if (filters.minInterest) {
            query.interest = { $gte: filters.minInterest };
        }
        if (filters.maxInterest) {
            query.interest = { ...query.interest, $lte: filters.maxInterest };
        }

        return await Product.find(query).sort({ createdAt: -1 });
    }

    /**
     * Get product by ID
     * @param {string} productId - Product ID
     * @returns {Promise<Object>} Product object
     */
    static async getProductById(productId) {
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error("Product not found");
        }
        return product;
    }

    /**
     * Update product by ID
     * @param {string} productId - Product ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated product
     */
    static async updateProduct(productId, updateData) {
        const product = await Product.findByIdAndUpdate(productId, {
            ...updateData,
            updatedAt: new Date()
        }, { new: true });
        
        if (!product) {
            throw new Error("Product not found");
        }
        return product;
    }

    /**
     * Delete product by ID
     * @param {string} productId - Product ID
     * @returns {Promise<Object>} Deleted product
     */
    static async deleteProduct(productId) {
        const product = await Product.findByIdAndDelete(productId);
        if (!product) {
            throw new Error("Product not found");
        }
        return product;
    }

    /**
     * Get products by type
     * @param {string} type - Product type (daily, weekly, monthly)
     * @returns {Promise<Array>} List of products
     */
    static async getProductsByType(type) {
        return await Product.find({ type: type.toLowerCase() }).sort({ name: 1 });
    }

    /**
     * Get active products
     * @returns {Promise<Array>} List of active products
     */
    static async getActiveProducts() {
        return await Product.find({ isActive: true }).sort({ name: 1 });
    }

    /**
     * Search products by name
     * @param {string} searchTerm - Search term
     * @returns {Promise<Array>} List of matching products
     */
    static async searchProducts(searchTerm) {
        const searchRegex = new RegExp(searchTerm, 'i'); // Case-insensitive search
        
        return await Product.find({
            $or: [
                { name: searchRegex },
                { description: searchRegex }
            ]
        }).sort({ name: 1 });
    }

    /**
     * Get product statistics
     * @returns {Promise<Object>} Product statistics
     */
    static async getProductStatistics() {
        const totalProducts = await Product.countDocuments();
        const activeProducts = await Product.countDocuments({ isActive: true });
        const inactiveProducts = await Product.countDocuments({ isActive: false });

        const productsByType = await Product.aggregate([
            {
                $group: {
                    _id: "$type",
                    count: { $sum: 1 },
                    avgInterest: { $avg: "$interest" },
                    minInterest: { $min: "$interest" },
                    maxInterest: { $max: "$interest" }
                }
            }
        ]);

        return {
            totalProducts,
            activeProducts,
            inactiveProducts,
            productsByType
        };
    }

    /**
     * Validate product business rules
     * @param {Object} productData - Product data to validate
     * @returns {Array} Array of validation errors
     */
    static validateProductData(productData) {
        const errors = [];

        // Name validation
        if (!productData.name || productData.name.trim().length === 0) {
            errors.push("Product name is required");
        }

        // Type validation
        const validTypes = ['daily', 'weekly', 'monthly'];
        if (!productData.type || !validTypes.includes(productData.type.toLowerCase())) {
            errors.push("Product type must be one of: daily, weekly, monthly");
        }

        // Interest rate validation
        if (productData.interest !== undefined) {
            const interest = parseFloat(productData.interest);
            if (isNaN(interest) || interest < 0 || interest > 100) {
                errors.push("Interest rate must be a number between 0 and 100");
            }
        }

        // Terms validation
        if (productData.terms !== undefined) {
            const terms = parseInt(productData.terms);
            if (isNaN(terms) || terms <= 0) {
                errors.push("Terms must be a positive number");
            }
        }

        // Grace period validation
        if (productData.Grace_period !== undefined) {
            const gracePeriod = parseInt(productData.Grace_period);
            if (isNaN(gracePeriod) || gracePeriod < 0) {
                errors.push("Grace period must be a non-negative number");
            }
        }

        // Document charges validation
        if (productData.docCharges !== undefined) {
            const docCharges = parseFloat(productData.docCharges);
            if (isNaN(docCharges) || docCharges < 0) {
                errors.push("Document charges must be a non-negative number");
            }
        }

        // Minimum and maximum amount validation
        if (productData.minAmount !== undefined && productData.maxAmount !== undefined) {
            const minAmount = parseFloat(productData.minAmount);
            const maxAmount = parseFloat(productData.maxAmount);
            if (!isNaN(minAmount) && !isNaN(maxAmount) && minAmount > maxAmount) {
                errors.push("Minimum amount cannot be greater than maximum amount");
            }
        }

        return errors;
    }

    /**
     * Calculate loan details based on product
     * @param {string} productId - Product ID
     * @param {number} loanAmount - Loan amount
     * @returns {Promise<Object>} Calculated loan details
     */
    static async calculateLoanDetails(productId, loanAmount) {
        const product = await this.getProductById(productId);
        const amount = parseFloat(loanAmount);

        if (isNaN(amount) || amount <= 0) {
            throw new Error("Invalid loan amount");
        }

        // Validate amount against product limits
        if (product.minAmount && amount < product.minAmount) {
            throw new Error(`Minimum loan amount for this product is ${product.minAmount}`);
        }
        if (product.maxAmount && amount > product.maxAmount) {
            throw new Error(`Maximum loan amount for this product is ${product.maxAmount}`);
        }

        const interestAmount = amount * (product.interest / 100);
        const totalReceivable = amount + interestAmount;
        const installmentAmount = totalReceivable / product.terms;

        return {
            principalAmount: amount,
            interestRate: product.interest,
            interestAmount: interestAmount,
            totalReceivable: totalReceivable,
            terms: product.terms,
            installmentAmount: installmentAmount,
            documentCharges: product.docCharges || 0,
            gracePeriod: product.Grace_period || 0,
            repaymentType: product.type
        };
    }

    /**
     * Toggle product active status
     * @param {string} productId - Product ID
     * @returns {Promise<Object>} Updated product
     */
    static async toggleProductStatus(productId) {
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error("Product not found");
        }

        product.isActive = !product.isActive;
        product.updatedAt = new Date();
        
        return await product.save();
    }

    /**
     * Check if product name exists
     * @param {string} name - Product name
     * @param {string} excludeId - Product ID to exclude from check
     * @returns {Promise<boolean>} True if name exists
     */
    static async productNameExists(name, excludeId = null) {
        const query = { name: { $regex: new RegExp(`^${name}$`, 'i') } };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }
        
        const existingProduct = await Product.findOne(query);
        return !!existingProduct;
    }
}

module.exports = ProductService;

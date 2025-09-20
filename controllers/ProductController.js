/**
 * PRODUCT CONTROLLER
 * 
 * HTTP request/response handler for loan product management.
 * Uses ProductService for business logic operations.
 */

const ProductService = require('../services/productService');

/**
 * Create a new product
 * POST /api/products
 */
exports.createProduct = async (req, res) => {
    try {
        const product = await ProductService.createProduct(req.body);
        res.status(201).json({
            success: true,
            data: product,
            message: 'Product created successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get all products
 * GET /api/products
 */
exports.getProducts = async (req, res) => {
    try {
        const products = await ProductService.getAllProducts(req.query);
        res.status(200).json({
            success: true,
            data: products,
            message: 'Products retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get a single product by ID
 * GET /api/products/:id
 */
exports.getProductById = async (req, res) => {
    try {
        const product = await ProductService.getProductById(req.params.id);
        res.status(200).json({
            success: true,
            data: product,
            message: 'Product retrieved successfully'
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
};

/**
 * Update a product by ID
 * PUT /api/products/:id
 */
exports.updateProduct = async (req, res) => {
    try {
        const product = await ProductService.updateProduct(req.params.id, req.body);
        res.status(200).json({
            success: true,
            data: product,
            message: 'Product updated successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Delete a product by ID
 * DELETE /api/products/:id
 */
exports.deleteProduct = async (req, res) => {
    try {
        await ProductService.deleteProduct(req.params.id);
        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


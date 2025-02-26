const express = require('express');
const router = express.Router();
const productController = require('../controllers/ProductController');

// POST /products - Create a new product
router.post('/', productController.createProduct);

// GET /products - Get all products

router.get('/', productController.getProducts);

// GET /products/:id - Get a single product by ID

router.get('/:id', productController.getProductById);

// PUT /products/:id - Update a product by ID

router.put('/:id', productController.updateProduct);

// DELETE /products/:id - Delete a product by ID

router.delete('/:id', productController.deleteProduct);

module.exports = router;

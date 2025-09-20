/**
 * PRODUCT MODEL
 * 
 * Defines loan product templates with specific terms and conditions.
 * Products determine how loans are structured including:
 * - Payment frequency and terms
 * - Interest rates and fees
 * - Grace periods and documentation requirements
 */

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    // Product Identification
    name: { 
        type: String, 
        required: true,
        trim: true              // Product display name
    },
    code: { 
        type: String, 
        required: true,
        unique: true,           // Unique product identifier
        trim: true,
        uppercase: true
    },
    
    // Repayment Structure
    type: { 
        type: String,
        enum: ['weekly', 'monthly', 'daily'],   // Payment frequency options
        required: true
    },
    terms: { 
        type: Number, 
        required: true,
        min: 1                  // Number of payment periods
    },
    
    // Financial Terms
    interest: { 
        type: Number, 
        required: true,
        min: 0,                 // Annual interest rate percentage
        max: 100
    },
    docCharges: { 
        type: Number,
        default: 0,             // Document processing fee percentage
        min: 0,
        max: 10                 // Reasonable limit for doc charges
    },
    
    // Grace Period Configuration
    Grace_period: { 
        type: Number,
        default: 0,             // Days before first payment is due
        min: 0
    },
    
    // Audit Fields
    CreateDate: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Create indexes for better query performance
productSchema.index({ code: 1 });
productSchema.index({ type: 1 });
productSchema.index({ name: 1 });

// Update the updatedAt field before saving
productSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model("Product", productSchema);

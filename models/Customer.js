/**
 * CUSTOMER MODEL
 * 
 * Defines the schema for customers who are the primary borrowers in the microfinance system.
 * Each customer belongs to a specific center and branch for organizational purposes.
 * Customers can have multiple loans throughout their relationship with the institution.
 */

const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
    // Personal Information
    firstName: { 
        type: String, 
        required: true,
        trim: true
    },
    lastName: { 
        type: String, 
        required: true,
        trim: true
    },
    
    // Contact Information
    email: { 
        type: String, 
        unique: true, 
        required: true,
        lowercase: true,
        trim: true
    },
    phone: { 
        type: String, 
        required: true,
        trim: true
    },
    
    // Address Details
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
    },
    
    // Identity and Demographics
    NIC_no: { 
        type: String, 
        required: true,
        unique: true,         // Prevent duplicate National ID registrations
        trim: true
    },
    dateOfBirth: { 
        type: Date, 
        required: false 
    },
    
    // Organizational Relationships
    centerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Center", 
        required: true        // Customer must belong to a center
    },
    branchId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Branch", 
        required: true        // Customer must belong to a branch
    },
    
    // Audit Fields
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Create indexes for better query performance
customerSchema.index({ email: 1 });
customerSchema.index({ NIC_no: 1 });
customerSchema.index({ centerId: 1 });
customerSchema.index({ branchId: 1 });

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;

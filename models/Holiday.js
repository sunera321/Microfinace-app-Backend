const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    date: { 
        type: Date, 
        required: true 
    },
    description: { 
        type: String 
    },
    centerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Center", 
        required: true 
    },
    branchId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Branch", 
        required: true 
    },
    productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Product", 
        required: true 
    },
    // createdBy removed from requirement; optional metadata can be added later
    isActive: { 
        type: Boolean, 
        default: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Index for efficient queries
holidaySchema.index({ centerId: 1, date: 1 });
holidaySchema.index({ branchId: 1, date: 1 });
holidaySchema.index({ productId: 1, date: 1 });

module.exports = mongoose.model("Holiday", holidaySchema); 
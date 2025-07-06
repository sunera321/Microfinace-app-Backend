const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { 
        type: String,
        enum: ['weekly', 'monthly', 'daily'],
        required: true
    },
    code: { type: String, required: true },
    interest: { type: Number, required: true },
    terms: { type: Number, required: true },
    docCharges: { type: Number},
    Grace_period: { type: Number },
    CreateDate: { type: Date, default: Date.now }
    
});

// Export model
module.exports = mongoose.model("Product", productSchema);

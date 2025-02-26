const mongoose = require("mongoose");

// Define the center schema
const centerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    collectDay: {
        type: String,
        enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        required: true
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId, // Reference to the Branch model
        ref: 'Branch',
        required: true
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Export the model
module.exports = mongoose.model("Center", centerSchema);

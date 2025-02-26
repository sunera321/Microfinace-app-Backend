const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, length: 3 },
    address: { type: String, required: true }
});

// Export model
module.exports = mongoose.model("Branch", branchSchema);

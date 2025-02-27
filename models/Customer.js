const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phone: { type: String, required: true },
    address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
    },
    NIC_no: { type: String, required: true },
    dateOfBirth: { type: Date, required: false },
    centerId: { type: mongoose.Schema.Types.ObjectId, ref: "Center", required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;

const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, unique: true },
    phone: { type: String },
    address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
    },
    NIC_no : {type:String   },
    dateOfBirth: { type: Date, required: false },
    
});

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;

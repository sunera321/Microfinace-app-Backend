const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    NIC_no : {type:String , unique: true },
    phone_no : {type:String},


});

const User = mongoose.model("User", userSchema);

module.exports = User;

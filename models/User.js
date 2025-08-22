const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    NIC_no: { type: String, unique: true },
    phone_no: { type: String },
    role: { 
        type: String, 
        enum: ['admin', 'user', 'manager'], 
        default: 'user' 
    },
    firebaseUid: { 
        type: String, 
        unique: true, 
        sparse: true // Allows null values, but enforces uniqueness when not null
    },
    isSignupCompleted: { 
        type: Boolean, 
        default: false // False until user completes signup
    },
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

const User = mongoose.model("User", userSchema);

module.exports = User;

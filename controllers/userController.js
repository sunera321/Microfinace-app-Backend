const User = require("../models/User"); // Import the User model

// Admin creates user profile (Step 1)
exports.createUserProfile = async (req, res) => {
    try {
        const { name, email, NIC_no, phone_no, role } = req.body;
        
        // Validate required fields
        if (!name || !email) {
            return res.status(400).json({ 
                message: "Name and email are required" 
            });
        }

        // Create user profile (without Firebase auth yet)
        const user = new User({
            name,
            email,
            NIC_no,
            phone_no,
            role: role || 'user',
            isSignupCompleted: false // User hasn't completed signup yet
        });
        
        const savedUser = await user.save();
        
        res.status(201).json({
            message: "User profile created successfully",
            user: savedUser,
            note: "User can now complete signup using their email"
        });
        
    } catch (error) {
        if (error.code === 11000) {
            // Duplicate email or NIC
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ 
                message: `${field} already exists` 
            });
        }
        res.status(400).json({ message: error.message });
    }
};

// User validates email and completes signup (Step 2)
exports.validateEmailForSignup = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                message: "Email is required" 
            });
        }

        // Check if user profile exists and signup is not completed
        const user = await User.findOne({ 
            email: email.toLowerCase(),
            isSignupCompleted: false 
        });
        
        if (!user) {
            return res.status(404).json({ 
                message: "No pending signup found for this email. Contact admin." 
            });
        }

        res.status(200).json({
            message: "Email validated successfully",
            user: {
                name: user.name,
                email: user.email,
                role: user.role
            },
            canProceedToPasswordCreation: true
        });
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Complete user signup with Firebase UID (Step 3)
exports.completeUserSignup = async (req, res) => {
    try {
        const { email, firebaseUid } = req.body;
        
        if (!email || !firebaseUid) {
            return res.status(400).json({ 
                message: "Email and firebaseUid are required" 
            });
        }

        // Update user with Firebase UID and mark signup as completed
        const user = await User.findOneAndUpdate(
            { 
                email: email.toLowerCase(),
                isSignupCompleted: false 
            },
            { 
                firebaseUid: firebaseUid,
                isSignupCompleted: true,
                updatedAt: new Date()
            },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ 
                message: "User not found or signup already completed" 
            });
        }

        res.status(200).json({
            message: "Signup completed successfully",
            user: user
        });
        
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Create a new user (legacy endpoint)
exports.createUser = async (req, res) => {
    try {
        const user = new User(req.body); // Create a new user instance with request data
        const savedUser = await user.save(); // Save to MongoDB
        res.status(201).json(savedUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
// Get all users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find(); // Find all users in the collection
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Get a user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id); // Find user by ID
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Update a user by ID
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
// Delete a user by ID
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(204).json({ message: "User deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

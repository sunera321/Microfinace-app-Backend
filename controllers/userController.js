const UserService = require("../services/userService"); // Import the User service

// Admin creates user profile (Step 1)
exports.createUserProfile = async (req, res) => {
    try {
        const savedUser = await UserService.createUserProfile(req.body);
        
        res.status(201).json({
            message: "User profile created successfully",
            user: savedUser,
            note: "User can now complete signup using their email"
        });
        
    } catch (error) {
        if (error.message.includes("already exists")) {
            return res.status(400).json({ message: error.message });
        }
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
        const userInfo = await UserService.validateEmailForSignup(email);

        res.status(200).json({
            message: "Email validated successfully",
            user: userInfo,
            canProceedToPasswordCreation: true
        });
        
    } catch (error) {
        if (error.message.includes("No pending signup")) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

// Complete user signup with Firebase UID (Step 3)
exports.completeUserSignup = async (req, res) => {
    try {
        const { email, firebaseUid } = req.body;
        const user = await UserService.completeUserSignup(email, firebaseUid);

        res.status(200).json({
            message: "Signup completed successfully",
            user: user
        });
        
    } catch (error) {
        if (error.message.includes("not found")) {
            return res.status(404).json({ message: error.message });
        }
        res.status(400).json({ message: error.message });
    }
};

// Create a new user (legacy endpoint)
exports.createUser = async (req, res) => {
    try {
        const savedUser = await UserService.createUser(req.body);
        res.status(201).json(savedUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all users
exports.getUsers = async (req, res) => {
    try {
        const users = await UserService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await UserService.getUserById(req.params.id);
        res.status(200).json(user);
    } catch (error) {
        if (error.message === "User not found") {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

// Update a user by ID
exports.updateUser = async (req, res) => {
    try {
        const user = await UserService.updateUser(req.params.id, req.body);
        res.status(200).json(user);
    } catch (error) {
        if (error.message === "User not found") {
            return res.status(404).json({ message: error.message });
        }
        res.status(400).json({ message: error.message });
    }
};

// Delete a user by ID
exports.deleteUser = async (req, res) => {
    try {
        await UserService.deleteUser(req.params.id);
        res.status(204).json({ message: "User deleted" });
    } catch (error) {
        if (error.message === "User not found") {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

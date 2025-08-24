const User = require("../models/User");

class UserService {
    /**
     * Create user profile by admin (Step 1 of registration)
     * @param {Object} userData - User data from request
     * @returns {Promise<Object>} Created user
     */
    static async createUserProfile(userData) {
        const { name, email, NIC_no, phone_no, role } = userData;
        
        // Validate required fields
        if (!name || !email) {
            throw new Error("Name and email are required");
        }

        // Create user profile (without Firebase auth yet)
        const user = new User({
            name,
            email: email.toLowerCase(),
            NIC_no,
            phone_no,
            role: role || 'user',
            isSignupCompleted: false // User hasn't completed signup yet
        });
        
        const savedUser = await user.save();
        return savedUser;
    }

    /**
     * Validate email for user signup (Step 2)
     * @param {string} email - User's email
     * @returns {Promise<Object>} User profile if valid
     */
    static async validateEmailForSignup(email) {
        if (!email) {
            throw new Error("Email is required");
        }

        // Check if user profile exists and signup is not completed
        const user = await User.findOne({ 
            email: email.toLowerCase(),
            isSignupCompleted: false 
        });
        
        if (!user) {
            throw new Error("No pending signup found for this email. Contact admin.");
        }

        return {
            name: user.name,
            email: user.email,
            role: user.role
        };
    }

    /**
     * Complete user signup with Firebase UID (Step 3)
     * @param {string} email - User's email
     * @param {string} firebaseUid - Firebase UID
     * @returns {Promise<Object>} Updated user
     */
    static async completeUserSignup(email, firebaseUid) {
        if (!email || !firebaseUid) {
            throw new Error("Email and firebaseUid are required");
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
            throw new Error("User not found or signup already completed");
        }

        return user;
    }

    /**
     * Get all users
     * @returns {Promise<Array>} List of users
     */
    static async getAllUsers() {
        return await User.find();
    }

    /**
     * Get user by ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} User object
     */
    static async getUserById(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }

    /**
     * Update user by ID
     * @param {string} userId - User ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated user
     */
    static async updateUser(userId, updateData) {
        const user = await User.findByIdAndUpdate(userId, {
            ...updateData,
            updatedAt: new Date()
        }, { new: true });
        
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }

    /**
     * Delete user by ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Deleted user
     */
    static async deleteUser(userId) {
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }

    /**
     * Create user (legacy method)
     * @param {Object} userData - User data
     * @returns {Promise<Object>} Created user
     */
    static async createUser(userData) {
        const user = new User(userData);
        return await user.save();
    }

    /**
     * Get user by Firebase UID
     * @param {string} firebaseUid - Firebase UID
     * @returns {Promise<Object>} User object
     */
    static async getUserByFirebaseUid(firebaseUid) {
        const user = await User.findOne({ firebaseUid });
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }

    /**
     * Update user status (activate/deactivate)
     * @param {string} userId - User ID
     * @param {boolean} isActive - Active status
     * @returns {Promise<Object>} Updated user
     */
    static async updateUserStatus(userId, isActive) {
        const user = await User.findByIdAndUpdate(userId, {
            isActive,
            updatedAt: new Date()
        }, { new: true });
        
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }
}

module.exports = UserService;

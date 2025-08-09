const User = require('../models/User');

const adminAuth = async (req, res, next) => {
    try {
        // Get user identity from header/body/query. Support ID or email.
        const userId = req.headers['user-id'] || req.body.createdBy || req.query.userId;
        const userEmail = req.headers['user-email'] || req.body.createdByEmail || req.query.userEmail;
        
        if (!userId && !userEmail) {
            return res.status(401).json({ message: "User identity required" });
        }

        // Find user by id or email and check role
        const user = userId
            ? await User.findById(userId)
            : await User.findOne({ email: userEmail });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.isActive) {
            return res.status(403).json({ message: "User account is deactivated" });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ message: "Admin access required" });
        }

        // Add user info to request
        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({ message: "Authentication error", error: error.message });
    }
};

module.exports = adminAuth; 
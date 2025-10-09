const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// New Two-Step User Creation Routes
router.post("/create-profile", userController.createUserProfile);        // Admin creates user profile
router.post("/validate-email", userController.validateEmailForSignup);   // User validates email for signup
router.post("/complete-signup", userController.completeUserSignup);      // User completes signup with Firebase
router.post("/:id/resend-invitation", userController.resendInvitationEmail); // Resend invitation email

// Legacy CRUD routes for users
router.post("/", userController.createUser);
router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);
router.get("/email/:email", userController.getUserByEmail);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

module.exports = router;

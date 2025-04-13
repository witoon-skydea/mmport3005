const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');

// Show login form
router.get('/login', authMiddleware.isNotAuthenticated, authController.showLogin);

// Handle login form submission
router.post('/login', authMiddleware.isNotAuthenticated, authController.login);

// Show registration form
router.get('/register', authMiddleware.isNotAuthenticated, authController.showRegister);

// Handle registration form submission
router.post('/register', authMiddleware.isNotAuthenticated, authController.register);

// Handle logout
router.get('/logout', authController.logout);

module.exports = router;
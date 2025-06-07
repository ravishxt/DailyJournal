const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const AuthController = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const { body } = require('express-validator');

// Validation rules
const registerValidation = [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required')
];

// Public routes
router.post('/register', registerValidation, validate, AuthController.register);
router.post('/login', loginValidation, validate, AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);

// Protected routes (require authentication)
router.use(authenticateToken);
router.get('/me', AuthController.getMe);
router.post('/logout', AuthController.logout);

module.exports = router;

const express = require('express');
const { body, validationResult } = require('express-validator');
const authService = require('../services/authService');
const { authLimiter } = require('../middleware/rateLimit');
const { inputSanitizer } = require('../middleware/security');
const { createLogger } = require('../utils/logger');

const router = express.Router();
const logger = createLogger('auth-routes');

// Apply rate limiting and input sanitization
router.use(authLimiter);
router.use(inputSanitizer);

// Validation rules
const loginValidation = [
  body('nationalId')
    .isLength({ min: 12, max: 12 })
    .matches(/^[0-9]{12}$/)
    .withMessage('National ID must be exactly 12 digits'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

const registerValidation = [
  body('nationalId')
    .isLength({ min: 12, max: 12 })
    .matches(/^[0-9]{12}$/)
    .withMessage('National ID must be exactly 12 digits'),
  body('name')
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name must contain only letters and spaces'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least 8 characters with uppercase, lowercase, number, and special character')
];

// Login endpoint
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { nationalId, password } = req.body;
    const metadata = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.requestId
    };

    const result = await authService.login(nationalId, password, metadata);

    // Set secure cookie
    res.cookie('sessionId', result.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        expiresIn: 3600 // 1 hour
      }
    });

  } catch (error) {
    logger.error('Login error:', {
      error: error.message,
      requestId: req.requestId,
      ip: req.ip
    });

    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// Register endpoint
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        expiresIn: 3600 // 1 hour
      }
    });

  } catch (error) {
    logger.error('Registration error:', {
      error: error.message,
      requestId: req.requestId,
      ip: req.ip
    });

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;
    const userId = req.user?.id;

    if (sessionId && userId) {
      await authService.logout(userId, sessionId);
    }

    res.clearCookie('sessionId');
    
    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error:', {
      error: error.message,
      requestId: req.requestId,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

module.exports = router;
const express = require('express');
const { body, validationResult } = require('express-validator');
const userService = require('../services/userService');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { createLogger } = require('../utils/logger');

const router = express.Router();
const logger = createLogger('user-routes');

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await userService.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get profile error:', {
      error: error.message,
      userId: req.user.id,
      requestId: req.requestId
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name must contain only letters and spaces'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const updatedUser = await userService.updateUser(req.user.id, req.body);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    logger.error('Update profile error:', {
      error: error.message,
      userId: req.user.id,
      requestId: req.requestId
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Change password
router.post('/change-password', authenticateToken, [
  body('currentPassword')
    .isLength({ min: 1 })
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least 8 characters with uppercase, lowercase, number, and special character')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    
    await userService.changePassword(req.user.id, currentPassword, newPassword);
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    logger.error('Change password error:', {
      error: error.message,
      userId: req.user.id,
      requestId: req.requestId
    });

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get user sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await userService.getUserSessions(req.user.id);
    
    res.json({
      success: true,
      data: sessions
    });

  } catch (error) {
    logger.error('Get sessions error:', {
      error: error.message,
      userId: req.user.id,
      requestId: req.requestId
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all users (admin only)
router.get('/all', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('Get all users error:', {
      error: error.message,
      userId: req.user.id,
      requestId: req.requestId
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create user (admin only)
router.post('/create', authenticateToken, requireRole(['admin', 'super_admin']), [
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
    .withMessage('Password must contain at least 8 characters with uppercase, lowercase, number, and special character'),
  body('role')
    .optional()
    .isIn(['citizen', 'admin'])
    .withMessage('Role must be either citizen or admin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const user = await userService.createUser(req.body);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });

  } catch (error) {
    logger.error('Create user error:', {
      error: error.message,
      adminId: req.user.id,
      requestId: req.requestId
    });

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
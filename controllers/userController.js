const userService = require('../services/userService');
const { 
  validateProfileUpdate, 
  validatePasswordChange, 
  validatePagination, 
  validateSearch, 
  validateFilter 
} = require('../utils/validation');
const { createLogger } = require('../utils/logger');

const logger = createLogger('user-controller');

class UserController {
  constructor() {
    this.userService = userService;
  }

  async getProfile(req, res) {
    try {
      const user = await this.userService.findUserById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
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
        message: 'Failed to retrieve profile'
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const { error } = validateProfileUpdate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
      }

      const updatedUser = await this.userService.updateUser(req.user.id, req.body);
      
      logger.info('User profile updated', {
        userId: req.user.id,
        updatedFields: Object.keys(req.body)
      });

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
        message: error.message
      });
    }
  }

  async changePassword(req, res) {
    try {
      const { error } = validatePasswordChange(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
      }

      const { currentPassword, newPassword } = req.body;
      
      await this.userService.changePassword(req.user.id, currentPassword, newPassword);
      
      logger.info('User password changed', {
        userId: req.user.id,
        ip: req.ip
      });

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
        message: error.message
      });
    }
  }

  async getUserSessions(req, res) {
    try {
      const sessions = await this.userService.getUserSessions(req.user.id);
      
      res.json({
        success: true,
        data: sessions
      });

    } catch (error) {
      logger.error('Get user sessions error:', {
        error: error.message,
        userId: req.user.id,
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve sessions'
      });
    }
  }

  async terminateSession(req, res) {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
      }

      await this.userService.terminateSession(req.user.id, sessionId);
      
      logger.info('Session terminated', {
        userId: req.user.id,
        sessionId,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Session terminated successfully'
      });

    } catch (error) {
      logger.error('Terminate session error:', {
        error: error.message,
        userId: req.user.id,
        sessionId: req.params.sessionId,
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async terminateAllSessions(req, res) {
    try {
      const currentSessionId = req.cookies.sessionId;
      
      await this.userService.terminateAllSessions(req.user.id, currentSessionId);
      
      logger.info('All sessions terminated', {
        userId: req.user.id,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'All sessions terminated successfully'
      });

    } catch (error) {
      logger.error('Terminate all sessions error:', {
        error: error.message,
        userId: req.user.id,
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getUserActivity(req, res) {
    try {
      const { error } = validatePagination(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
      }

      const { page, limit, sortBy, sortOrder } = req.query;
      const activity = await this.userService.getUserActivity(req.user.id, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy: sortBy || 'timestamp',
        sortOrder: sortOrder || 'desc'
      });

      res.json({
        success: true,
        data: activity
      });

    } catch (error) {
      logger.error('Get user activity error:', {
        error: error.message,
        userId: req.user.id,
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve activity'
      });
    }
  }

  async deleteAccount(req, res) {
    try {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password confirmation is required'
        });
      }

      await this.userService.deleteAccount(req.user.id, password);
      
      // Clear session cookie
      res.clearCookie('sessionId');
      
      logger.info('User account deleted', {
        userId: req.user.id,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });

    } catch (error) {
      logger.error('Delete account error:', {
        error: error.message,
        userId: req.user.id,
        requestId: req.requestId
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new UserController();
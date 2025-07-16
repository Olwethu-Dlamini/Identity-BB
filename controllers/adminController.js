const userService = require('../services/userService');
const auditService = require('../services/auditService');
const { 
  validateAdminUserCreation, 
  validateUserUpdate, 
  validatePagination, 
  validateSearch, 
  validateFilter 
} = require('../utils/validation');
const { createLogger } = require('../utils/logger');

const logger = createLogger('admin-controller');

class AdminController {
  constructor() {
    this.userService = userService;
    this.auditService = auditService;
  }

  async getAllUsers(req, res) {
    try {
      const { error: paginationError } = validatePagination(req.query);
      if (paginationError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pagination parameters',
          errors: paginationError.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
      }

      const { error: filterError } = validateFilter(req.query);
      if (filterError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid filter parameters',
          errors: filterError.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
      }

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc',
        role: req.query.role,
        status: req.query.status,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      };

      const result = await this.userService.getAllUsers(options);

      res.json({
        success: true,
        data: result.users,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });

    } catch (error) {
      logger.error('Get all users error:', {
        error: error.message,
        adminId: req.user.id,
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users'
      });
    }
  }

  async searchUsers(req, res) {
    try {
      const { error } = validateSearch(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid search parameters',
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
      }

      const { query, searchBy } = req.query;
      const users = await this.userService.searchUsers(query, searchBy);

      res.json({
        success: true,
        data: users
      });

    } catch (error) {
      logger.error('Search users error:', {
        error: error.message,
        adminId: req.user.id,
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to search users'
      });
    }
  }

  async getUserById(req, res) {
    try {
      const { userId } = req.params;
      
      const user = await this.userService.findUserById(userId);
      
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
      logger.error('Get user by ID error:', {
        error: error.message,
        adminId: req.user.id,
        targetUserId: req.params.userId,
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user'
      });
    }
  }

  async createUser(req, res) {
    try {
      const { error } = validateAdminUserCreation(req.body);
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

      const user = await this.userService.createUser(req.body);
      
      logger.info('User created by admin', {
        adminId: req.user.id,
        createdUserId: user.id,
        userRole: req.body.role,
        ip: req.ip
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });

    } catch (error) {
      logger.error('Create user error:', {
        error: error.message,
        adminId: req.user.id,
        nationalId: req.body.nationalId,
        requestId: req.requestId
      });

      const statusCode = error.message.includes('already exists') ? 409 : 400;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateUser(req, res) {
    try {
      const { userId } = req.params;
      
      const { error } = validateUserUpdate(req.body);
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

      const updatedUser = await this.userService.updateUser(userId, req.body);
      
      logger.info('User updated by admin', {
        adminId: req.user.id,
        updatedUserId: userId,
        updatedFields: Object.keys(req.body),
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });

    } catch (error) {
      logger.error('Update user error:', {
        error: error.message,
        adminId: req.user.id,
        targetUserId: req.params.userId,
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteUser(req, res) {
    try {
      const { userId } = req.params;
      
      // Prevent admin from deleting themselves
      if (userId === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      await this.userService.deleteUser(userId);
      
      logger.info('User deleted by admin', {
        adminId: req.user.id,
        deletedUserId: userId,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      logger.error('Delete user error:', {
        error: error.message,
        adminId: req.user.id,
        targetUserId: req.params.userId,
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async lockUser(req, res) {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      
      await this.userService.lockUser(userId, reason);
      
      logger.info('User locked by admin', {
        adminId: req.user.id,
        lockedUserId: userId,
        reason,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'User locked successfully'
      });

    } catch (error) {
      logger.error('Lock user error:', {
        error: error.message,
        adminId: req.user.id,
        targetUserId: req.params.userId,
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async unlockUser(req, res) {
    try {
      const { userId } = req.params;
      
      await this.userService.unlockUser(userId);
      
      logger.info('User unlocked by admin', {
        adminId: req.user.id,
        unlockedUserId: userId,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'User unlocked successfully'
      });

    } catch (error) {
      logger.error('Unlock user error:', {
        error: error.message,
        adminId: req.user.id,
        targetUserId: req.params.userId,
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getUserSessions(req, res) {
    try {
      const { userId } = req.params;
      
      const sessions = await this.userService.getUserSessions(userId);
      
      res.json({
        success: true,
        data: sessions
      });

    } catch (error) {
      logger.error('Get user sessions error:', {
        error: error.message,
        adminId: req.user.id,
        targetUserId: req.params.userId,
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user sessions'
      });
    }
  }

  async terminateUserSession(req, res) {
    try {
      const { userId, sessionId } = req.params;
      
      await this.userService.terminateSession(userId, sessionId);
      
      logger.info('User session terminated by admin', {
        adminId: req.user.id,
        userId,
        sessionId,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Session terminated successfully'
      });

    } catch (error) {
      logger.error('Terminate user session error:', {
        error: error.message,
        adminId: req.user.id,
        targetUserId: req.params.userId,
        sessionId: req.params.sessionId,
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getSystemStats(req, res) {
    try {
      const stats = await this.userService.getSystemStats();
      
      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Get system stats error:', {
        error: error.message,
        adminId: req.user.id,
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve system statistics'
      });
    }
  }

  async getAuditLogs(req, res) {
    try {
      const { error } = validatePagination(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pagination parameters',
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
      }

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sortBy: req.query.sortBy || 'timestamp',
        sortOrder: req.query.sortOrder || 'desc',
        userId: req.query.userId,
        action: req.query.action,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      };

      const result = await this.auditService.getAuditLogs(options);

      res.json({
        success: true,
        data: result.logs,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });

    } catch (error) {
      logger.error('Get audit logs error:', {
        error: error.message,
        adminId: req.user.id,
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve audit logs'
      });
    }
  }
}

module.exports = new AdminController();
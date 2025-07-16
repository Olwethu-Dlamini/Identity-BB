const sessionService = require('../services/sessionService');
const { validatePagination } = require('../utils/validation');
const { createLogger } = require('../utils/logger');

const logger = createLogger('session-controller');

class SessionController {
  constructor() {
    this.sessionService = sessionService;
  }

  async getCurrentSession(req, res) {
    try {
      const sessionId = req.cookies.sessionId;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'No active session found'
        });
      }

      const session = await this.sessionService.getSessionById(sessionId);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      res.json({
        success: true,
        data: session
      });

    } catch (error) {
      logger.error('Get current session error:', {
        error: error.message,
        userId: req.user?.id,
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve session'
      });
    }
  }

  async getUserSessions(req, res) {
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
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc',
        isActive: req.query.isActive
      };

      const result = await this.sessionService.getUserSessions(req.user.id, options);

      res.json({
        success: true,
        data: result.sessions,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
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

      await this.sessionService.terminateSession(req.user.id, sessionId);
      
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
      
      const result = await this.sessionService.terminateAllSessions(req.user.id, currentSessionId);
      
      logger.info('All sessions terminated', {
        userId: req.user.id,
        terminatedCount: result.terminatedCount,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'All sessions terminated successfully',
        data: {
          terminatedCount: result.terminatedCount
        }
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

  async extendSession(req, res) {
    try {
      const sessionId = req.cookies.sessionId;
      const { hours } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'No active session found'
        });
      }

      const extensionHours = parseInt(hours) || 24; // Default 24 hours
      
      if (extensionHours > 168) { // Max 1 week
        return res.status(400).json({
          success: false,
          message: 'Cannot extend session for more than 1 week'
        });
      }

      await this.sessionService.extendSession(sessionId, extensionHours);
      
      logger.info('Session extended', {
        userId: req.user.id,
        sessionId,
        extensionHours,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Session extended successfully',
        data: {
          extensionHours,
          newExpiresAt: new Date(Date.now() + extensionHours * 60 * 60 * 1000)
        }
      });

    } catch (error) {
      logger.error('Extend session error:', {
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

  async getSessionActivity(req, res) {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
      }

      const activity = await this.sessionService.getSessionActivity(sessionId);
      
      res.json({
        success: true,
        data: activity
      });

    } catch (error) {
      logger.error('Get session activity error:', {
        error: error.message,
        userId: req.user.id,
        sessionId: req.params.sessionId,
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve session activity'
      });
    }
  }

  async getActiveSessions(req, res) {
    try {
      const activeSessions = await this.sessionService.getActiveSessions(req.user.id);
      
      res.json({
        success: true,
        data: activeSessions
      });

    } catch (error) {
      logger.error('Get active sessions error:', {
        error: error.message,
        userId: req.user.id,
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve active sessions'
      });
    }
  }
}

module.exports = new SessionController();   
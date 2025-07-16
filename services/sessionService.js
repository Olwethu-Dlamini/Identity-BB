const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const { createLogger } = require('../utils/logger');

const logger = createLogger('session-service');

class SessionService {
  async getSessionById(sessionId) {
    try {
      const query = `
        SELECT s.id, s.userId, s.createdAt, s.expiresAt, s.lastActivity, 
               s.isActive, s.ipAddress, s.userAgent, s.loggedOutAt,
               u.name, u.nationalId, u.email, u.role
        FROM sessions s
        JOIN users u ON s.userId = u.id
        WHERE s.id = ?
      `;
      
      const sessions = await db.query(query, [sessionId]);
      return sessions.length ? sessions[0] : null;
    } catch (error) {
      logger.error('Error getting session by ID:', error);
      throw error;
    }
  }

  async getUserSessions(userId, options = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', isActive } = options;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE userId = ?';
      let params = [userId];

      if (isActive !== undefined) {
        whereClause += ' AND isActive = ?';
        params.push(isActive);
      }

      const query = `
        SELECT id, createdAt, expiresAt, lastActivity, isActive, 
               ipAddress, userAgent, loggedOutAt
        FROM sessions 
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ${limit} OFFSET ${offset}
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM sessions 
        ${whereClause}
      `;

      const [sessions, countResult] = await Promise.all([
        db.query(query, params),
        db.query(countQuery, params)
      ]);

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      return {
        sessions,
        page,
        limit,
        total,
        totalPages
      };
    } catch (error) {
      logger.error('Error getting user sessions:', error);
      throw error;
    }
  }

  async terminateSession(userId, sessionId) {
    try {
      const query = `
        UPDATE sessions 
        SET isActive = 0, loggedOutAt = NOW()
        WHERE id = ? AND userId = ?
      `;
      
      await db.query(query, [sessionId, userId]);
      return true;
    } catch (error) {
      logger.error('Error terminating session:', error);
      throw error;
    }
  }

  async terminateAllSessions(userId, excludeSessionId = null) {
    try {
      let query = `
        UPDATE sessions 
        SET isActive = 0, loggedOutAt = NOW()
        WHERE userId = ? AND isActive = 1
      `;
      let params = [userId];

      if (excludeSessionId) {
        query += ' AND id != ?';
        params.push(excludeSessionId);
      }

      const result = await db.query(query, params);
      return { terminatedCount: result.affectedRows };
    } catch (error) {
      logger.error('Error terminating all sessions:', error);
      throw error;
    }
  }

  async extendSession(sessionId, hours = 24) {
    try {
      const newExpiresAt = new Date(Date.now() + (hours * 60 * 60 * 1000));
      
      const query = `
        UPDATE sessions 
        SET expiresAt = ?
        WHERE id = ? AND isActive = 1
      `;
      
      await db.query(query, [newExpiresAt, sessionId]);
      return true;
    } catch (error) {
      logger.error('Error extending session:', error);
      throw error;
    }
  }

  async getSessionActivity(sessionId) {
    try {
      const query = `
        SELECT al.id, al.action, al.details, al.timestamp, al.ipAddress
        FROM audit_logs al
        JOIN sessions s ON al.userId = s.userId
        WHERE s.id = ?
        ORDER BY al.timestamp DESC
        LIMIT 100
      `;
      
      const activity = await db.query(query, [sessionId]);
      return activity;
    } catch (error) {
      logger.error('Error getting session activity:', error);
      throw error;
    }
  }

  async getActiveSessions(userId) {
    try {
      const query = `
        SELECT id, createdAt, expiresAt, lastActivity, ipAddress, userAgent
        FROM sessions 
        WHERE userId = ? AND isActive = 1 AND expiresAt > NOW()
        ORDER BY lastActivity DESC
      `;
      
      const sessions = await db.query(query, [userId]);
      return sessions;
    } catch (error) {
      logger.error('Error getting active sessions:', error);
      throw error;
    }
  }

  async cleanupExpiredSessions() {
    try {
      const query = `
        UPDATE sessions 
        SET isActive = 0
        WHERE expiresAt < NOW() AND isActive = 1
      `;
      
      const result = await db.query(query);
      logger.info(`Cleaned up ${result.affectedRows} expired sessions`);
      return result.affectedRows;
    } catch (error) {
      logger.error('Error cleaning up expired sessions:', error);
      throw error;
    }
  }
}

module.exports = new SessionService();
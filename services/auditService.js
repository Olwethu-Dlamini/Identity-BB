const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const { createLogger } = require('../utils/logger');

const logger = createLogger('audit-service');

class AuditService {
  async logUserAction(userId, action, details = {}, metadata = {}) {
    try {
      const insertQuery = `
        INSERT INTO audit_logs (id, userId, action, details, ipAddress, userAgent, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;

      await db.query(insertQuery, [
        uuidv4(),
        userId,
        action,
        JSON.stringify(details),
        metadata.ip || null,
        metadata.userAgent || null
      ]);

      return true;
    } catch (error) {
      logger.error('Error logging user action:', error);
      throw error;
    }
  }

  async getUserAuditLogs(userId, options = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'timestamp', sortOrder = 'desc', action, dateFrom, dateTo } = options;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE userId = ?';
      let params = [userId];

      if (action) {
        whereClause += ' AND action = ?';
        params.push(action);
      }

      if (dateFrom) {
        whereClause += ' AND timestamp >= ?';
        params.push(dateFrom);
      }

      if (dateTo) {
        whereClause += ' AND timestamp <= ?';
        params.push(dateTo);
      }

      const query = `
        SELECT id, action, details, timestamp, ipAddress, userAgent
        FROM audit_logs 
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ${limit} OFFSET ${offset}
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM audit_logs 
        ${whereClause}
      `;

      const [logs, countResult] = await Promise.all([
        db.query(query, params),
        db.query(countQuery, params)
      ]);

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      return {
        logs,
        page,
        limit,
        total,
        totalPages
      };
    } catch (error) {
      logger.error('Error getting user audit logs:', error);
      throw error;
    }
  }

  async getAuditLogs(options = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'timestamp', sortOrder = 'desc', userId, action, dateFrom, dateTo } = options;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      let params = [];

      if (userId) {
        whereClause += ' AND userId = ?';
        params.push(userId);
      }

      if (action) {
        whereClause += ' AND action = ?';
        params.push(action);
      }

      if (dateFrom) {
        whereClause += ' AND timestamp >= ?';
        params.push(dateFrom);
      }

      if (dateTo) {
        whereClause += ' AND timestamp <= ?';
        params.push(dateTo);
      }

      const query = `
        SELECT al.id, al.userId, al.action, al.details, al.timestamp, al.ipAddress, al.userAgent,
               u.name, u.nationalId, u.email
        FROM audit_logs al
        LEFT JOIN users u ON al.userId = u.id
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ${limit} OFFSET ${offset}
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM audit_logs al
        LEFT JOIN users u ON al.userId = u.id
        ${whereClause}
      `;

      const [logs, countResult] = await Promise.all([
        db.query(query, params),
        db.query(countQuery, params)
      ]);

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      return {
        logs,
        page,
        limit,
        total,
        totalPages
      };
    } catch (error) {
      logger.error('Error getting audit logs:', error);
      throw error;
    }
  }

  async getAuditLogsByAction(action, options = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'timestamp', sortOrder = 'desc', dateFrom, dateTo } = options;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE action = ?';
      let params = [action];

      if (dateFrom) {
        whereClause += ' AND timestamp >= ?';
        params.push(dateFrom);
      }

      if (dateTo) {
        whereClause += ' AND timestamp <= ?';
        params.push(dateTo);
      }

      const query = `
        SELECT al.id, al.userId, al.action, al.details, al.timestamp, al.ipAddress, al.userAgent,
               u.name, u.nationalId, u.email
        FROM audit_logs al
        LEFT JOIN users u ON al.userId = u.id
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ${limit} OFFSET ${offset}
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM audit_logs al
        LEFT JOIN users u ON al.userId = u.id
        ${whereClause}
      `;

      const [logs, countResult] = await Promise.all([
        db.query(query, params),
        db.query(countQuery, params)
      ]);

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      return {
        logs,
        page,
        limit,
        total,
        totalPages
      };
    } catch (error) {
      logger.error('Error getting audit logs by action:', error);
      throw error;
    }
  }

  async getAuditStats(options = {}) {
    try {
      const { dateFrom, dateTo, userId } = options;

      let whereClause = 'WHERE 1=1';
      let params = [];

      if (userId) {
        whereClause += ' AND userId = ?';
        params.push(userId);
      }

      if (dateFrom) {
        whereClause += ' AND timestamp >= ?';
        params.push(dateFrom);
      }

      if (dateTo) {
        whereClause += ' AND timestamp <= ?';
        params.push(dateTo);
      }

      const statsQuery = `
        SELECT 
          COUNT(*) as totalEvents,
          COUNT(DISTINCT userId) as uniqueUsers,
          COUNT(DISTINCT action) as uniqueActions,
          COUNT(DISTINCT ipAddress) as uniqueIps,
          action,
          COUNT(*) as actionCount
        FROM audit_logs
        ${whereClause}
        GROUP BY action
        ORDER BY actionCount DESC
      `;

      const timeStatsQuery = `
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as events
        FROM audit_logs
        ${whereClause}
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
        LIMIT 30
      `;

      const [stats, timeStats] = await Promise.all([
        db.query(statsQuery, params),
        db.query(timeStatsQuery, params)
      ]);

      return {
        overview: {
          totalEvents: stats[0]?.totalEvents || 0,
          uniqueUsers: stats[0]?.uniqueUsers || 0,
          uniqueActions: stats[0]?.uniqueActions || 0,
          uniqueIps: stats[0]?.uniqueIps || 0
        },
        actionBreakdown: stats,
        timelineStats: timeStats
      };
    } catch (error) {
      logger.error('Error getting audit stats:', error);
      throw error;
    }
  }

  async exportUserAuditLogs(userId, options = {}) {
    try {
      const { dateFrom, dateTo, action, format = 'csv' } = options;

      let whereClause = 'WHERE userId = ?';
      let params = [userId];

      if (action) {
        whereClause += ' AND action = ?';
        params.push(action);
      }

      if (dateFrom) {
        whereClause += ' AND timestamp >= ?';
        params.push(dateFrom);
      }

      if (dateTo) {
        whereClause += ' AND timestamp <= ?';
        params.push(dateTo);
      }

      const query = `
        SELECT id, action, details, timestamp, ipAddress, userAgent
        FROM audit_logs 
        ${whereClause}
        ORDER BY timestamp DESC
      `;

      const logs = await db.query(query, params);

      if (format === 'csv') {
        const headers = ['ID', 'Action', 'Details', 'Timestamp', 'IP Address', 'User Agent'];
        const csvContent = [
          headers.join(','),
          ...logs.map(log => [
            log.id,
            log.action,
            `"${JSON.stringify(log.details).replace(/"/g, '""')}"`,
            log.timestamp,
            log.ipAddress || '',
            `"${(log.userAgent || '').replace(/"/g, '""')}"`
          ].join(','))
        ].join('\n');

        return csvContent;
      } else {
        return JSON.stringify(logs, null, 2);
      }
    } catch (error) {
      logger.error('Error exporting user audit logs:', error);
      throw error;
    }
  }
}

module.exports = new AuditService();
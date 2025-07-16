const auditService = require('../services/auditService');
const { validatePagination, validateFilter } = require('../utils/validation');
const { createLogger } = require('../utils/logger');

const logger = createLogger('audit-controller');

class AuditController {
  constructor() {
    this.auditService = auditService;
  }

  async getUserAuditLogs(req, res) {
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
        action: req.query.action,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      };

      const result = await this.auditService.getUserAuditLogs(req.user.id, options);

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
      logger.error('Get user audit logs error:', {
        error: error.message,
        userId: req.user.id,
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve audit logs'
      });
    }
  }

  async getAuditLogsByAction(req, res) {
    try {
      const { action } = req.params;
      
      if (!action) {
        return res.status(400).json({
          success: false,
          message: 'Action is required'
        });
      }

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
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      };

      const result = await this.auditService.getAuditLogsByAction(action, options);

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
      logger.error('Get audit logs by action error:', {
        error: error.message,
        action: req.params.action,
        userId: req.user.id,
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve audit logs'
      });
    }
  }

  async getAuditStats(req, res) {
    try {
      const { dateFrom, dateTo } = req.query;
      
      const stats = await this.auditService.getAuditStats({
        dateFrom,
        dateTo,
        userId: req.user.id
      });

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Get audit stats error:', {
        error: error.message,
        userId: req.user.id,
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve audit statistics'
      });
    }
  }

  async exportAuditLogs(req, res) {
    try {
      const { format = 'csv' } = req.query;
      
      if (!['csv', 'json'].includes(format)) {
        return res.status(400).json({
          success: false,
          message: 'Format must be csv or json'
        });
      }

      const options = {
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        action: req.query.action,
        format
      };

      const exportData = await this.auditService.exportUserAuditLogs(req.user.id, options);
      
      const filename = `audit_logs_${req.user.id}_${new Date().toISOString().split('T')[0]}.${format}`;
      
      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      res.send(exportData);

    } catch (error) {
      logger.error('Export audit logs error:', {
        error: error.message,
        userId: req.user.id,
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to export audit logs'
      });
    }
  }
}

module.exports = new AuditController();
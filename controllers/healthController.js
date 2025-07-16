const { db } = require('../config/database');
const { createLogger } = require('../utils/logger');

const logger = createLogger('health-controller');

class HealthController {
  constructor() {
    this.startTime = Date.now();
  }

  async getHealth(req, res) {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
          database: await this.checkDatabase(),
          memory: this.checkMemory(),
          system: this.checkSystem()
        }
      };

      // Check if all services are healthy
      const isHealthy = Object.values(health.services).every(service => service.status === 'healthy');
      
      if (!isHealthy) {
        health.status = 'unhealthy';
        return res.status(503).json(health);
      }

      res.json(health);

    } catch (error) {
      logger.error('Health check error:', error);
      
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  async getDetailedHealth(req, res) {
    try {
      const detailedHealth = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
          database: await this.checkDatabase(),
          memory: this.checkMemory(),
          system: this.checkSystem(),
          disk: this.checkDisk(),
          network: this.checkNetwork()
        },
        metrics: {
          requests: this.getRequestMetrics(),
          errors: this.getErrorMetrics(),
          performance: this.getPerformanceMetrics()
        }
      };

      // Check if all services are healthy
      const isHealthy = Object.values(detailedHealth.services).every(service => service.status === 'healthy');
      
      if (!isHealthy) {
        detailedHealth.status = 'unhealthy';
        return res.status(503).json(detailedHealth);
      }

      res.json(detailedHealth);

    } catch (error) {
      logger.error('Detailed health check error:', error);
      
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  async checkDatabase() {
    try {
      const startTime = Date.now();
      await db.query('SELECT 1');
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        message: 'Database connection successful'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        message: 'Database connection failed'
      };
    }
  }

  checkMemory() {
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const freeMemory = totalMemory - usedMemory;
    const memoryPercentage = (usedMemory / totalMemory) * 100;
    
    return {
      status: memoryPercentage > 90 ? 'unhealthy' : 'healthy',
      usage: {
        used: `${Math.round(usedMemory / 1024 / 1024)}MB`,
        total: `${Math.round(totalMemory / 1024 / 1024)}MB`,
        free: `${Math.round(freeMemory / 1024 / 1024)}MB`,
        percentage: `${memoryPercentage.toFixed(2)}%`
      },
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
    };
  }

  checkSystem() {
    const cpuUsage = process.cpuUsage();
    const loadAverage = require('os').loadavg();
    
    return {
      status: 'healthy',
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      loadAverage: loadAverage,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version
    };
  }

  checkDisk() {
    const fs = require('fs');
    
    try {
      const stats = fs.statSync('.');
      return {
        status: 'healthy',
        accessible: true,
        message: 'Disk access successful'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        accessible: false,
        error: error.message
      };
    }
  }

  checkNetwork() {
    const networkInterfaces = require('os').networkInterfaces();
    const interfaces = Object.keys(networkInterfaces).length;
    
    return {
      status: 'healthy',
      interfaces: interfaces,
      hostname: require('os').hostname()
    };
  }

  getRequestMetrics() {
    // This would be implemented with actual metrics collection
    return {
      total: 0,
      successful: 0,
      failed: 0,
      averageResponseTime: 0
    };
  }

  getErrorMetrics() {
    // This would be implemented with actual error tracking
    return {
      total: 0,
      rate: 0,
      lastError: null
    };
  }

  getPerformanceMetrics() {
    const hrtime = process.hrtime();
    
    return {
      uptime: process.uptime(),
      responseTime: hrtime[0] * 1000 + hrtime[1] / 1000000,
      timestamp: new Date().toISOString()
    };
  }

  async getReadiness(req, res) {
    try {
      const readiness = {
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: await this.checkDatabase(),
          startup: {
            status: 'healthy',
            message: 'Application started successfully'
          }
        }
      };

      const isReady = Object.values(readiness.checks).every(check => check.status === 'healthy');
      
      if (!isReady) {
        readiness.status = 'not ready';
        return res.status(503).json(readiness);
      }

      res.json(readiness);

    } catch (error) {
      logger.error('Readiness check error:', error);
      
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  async getLiveness(req, res) {
    try {
      const liveness = {
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        pid: process.pid
      };

      res.json(liveness);

    } catch (error) {
      logger.error('Liveness check error:', error);
      
      res.status(503).json({
        status: 'dead',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }
}

module.exports = new HealthController();
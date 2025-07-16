const rateLimit = require('express-rate-limit');
const { createLogger } = require('../utils/logger');

const logger = createLogger('rate-limit');

const createRateLimiter = (options = {}) => {
  return rateLimit({
    windowMs: (options.windowMs || 15) * 60 * 1000, // minutes to milliseconds
    max: options.max || 100,
    message: options.message || 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        url: req.originalUrl,
        userAgent: req.get('User-Agent')
      });
      
      res.status(429).json({
        error: 'Too many requests',
        message: options.message || 'Rate limit exceeded',
        retryAfter: Math.round(options.windowMs / 1000) || 900
      });
    }
  });
};

const authLimiter = createRateLimiter({
  windowMs: 15,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5,
  message: 'Too many authentication attempts, please try again later.'
});

const generalLimiter = createRateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100
});

module.exports = {
  authLimiter,
  generalLimiter,
  createRateLimiter
};
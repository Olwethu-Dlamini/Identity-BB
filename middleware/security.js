const { v4: uuidv4 } = require('uuid');
const SecurityConfig = require('../config/security');
const { createLogger } = require('../utils/logger');

const logger = createLogger('security-middleware');

const securityMiddleware = (req, res, next) => {
  // Generate request ID
  req.requestId = uuidv4();
  
  // Set security headers
  res.setHeader('X-Request-ID', req.requestId);
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove server header
  res.removeHeader('X-Powered-By');
  
  // Log request
  logger.info('Request received', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  next();
};

const inputSanitizer = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = SecurityConfig.sanitizeInput(req.body[key]);
      }
    }
  }
  
  next();
};

const auditMiddleware = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log response
    logger.info('Response sent', {
      requestId: req.requestId,
      statusCode: res.statusCode,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user?.id || null
    });
    
    return originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  securityMiddleware,
  inputSanitizer,
  auditMiddleware
};
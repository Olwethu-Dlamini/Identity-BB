const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const { createLogger } = require('../utils/logger');

const logger = createLogger('auth-middleware');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const userQuery = `
      SELECT id, nationalId, name, email, role, status, lastLogin, failedAttempts, lockedUntil
      FROM users 
      WHERE id = ?
    `;
    
    const users = await db.query(userQuery, [decoded.id]);
    
    if (!users.length) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = users[0];
    
    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Account is not active' });
    }

    if (user.lockedUntil && new Date() < user.lockedUntil) {
      return res.status(423).json({ error: 'Account is locked' });
    }

    // Check if session exists
    const sessionQuery = `
      SELECT id, userId, expiresAt, isActive
      FROM sessions 
      WHERE userId = ? AND token = ? AND isActive = 1
    `;
    
    const sessions = await db.query(sessionQuery, [user.id, token]);
    
    if (!sessions.length) {
      return res.status(401).json({ error: 'Session not found' });
    }

    const session = sessions[0];
    
    if (new Date() > session.expiresAt) {
      await db.query('UPDATE sessions SET isActive = 0 WHERE id = ?', [session.id]);
      return res.status(401).json({ error: 'Session expired' });
    }

    // Update session activity
    await db.query(
      'UPDATE sessions SET lastActivity = NOW() WHERE id = ?',
      [session.id]
    );

    req.user = {
      id: user.id,
      nationalId: user.nationalId,
      name: user.name,
      email: user.email,
      role: user.role,
      sessionId: session.id
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = { authenticateToken, requireRole };
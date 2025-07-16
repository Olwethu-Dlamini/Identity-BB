const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const SecurityConfig = require('../config/security');
const { createLogger } = require('../utils/logger');

const logger = createLogger('auth-service');

class AuthService {
  async login(nationalId, password, metadata = {}) {
    try {
      // Check if user exists
      const userQuery = `
        SELECT id, nationalId, name, email, password, role, status, 
               failedAttempts, lockedUntil, lastLogin
        FROM users 
        WHERE nationalId = ?
      `;
      
      const users = await db.query(userQuery, [nationalId]);
      
      if (!users.length) {
        await this.logFailedAttempt(nationalId, 'User not found', metadata);
        throw new Error('Invalid credentials');
      }

      const user = users[0];

      // Check if account is locked
      if (user.lockedUntil && new Date() < user.lockedUntil) {
        await this.logFailedAttempt(nationalId, 'Account locked', metadata);
        throw new Error('Account is locked due to too many failed attempts');
      }

      // Check if account is active
      if (user.status !== 'active') {
        await this.logFailedAttempt(nationalId, 'Account inactive', metadata);
        throw new Error('Account is not active');
      }

      // Verify password
      const isValidPassword = await SecurityConfig.verifyPassword(password, user.password);
      
      if (!isValidPassword) {
        await this.handleFailedLogin(user.id, nationalId, metadata);
        throw new Error('Invalid credentials');
      }

      // Reset failed attempts on successful login
      await this.resetFailedAttempts(user.id);

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Create session
      const sessionId = await this.createSession(user.id, tokens.accessToken, metadata);

      // Update last login
      await db.query(
        'UPDATE users SET lastLogin = NOW() WHERE id = ?',
        [user.id]
      );

      // Log successful login
      await this.logSuccessfulLogin(user.id, metadata);

      return {
        user: {
          id: user.id,
          nationalId: user.nationalId,
          name: user.name,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin
        },
        tokens,
        sessionId
      };

    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async register(userData) {
    try {
      const { nationalId, name, email, password } = userData;

      // Check if user already exists
      const existingUserQuery = `
        SELECT id FROM users 
        WHERE nationalId = ? OR email = ?
      `;
      
      const existingUsers = await db.query(existingUserQuery, [nationalId, email]);
      
      if (existingUsers.length) {
        throw new Error('User already exists');
      }

      // Validate password strength
      if (!SecurityConfig.isStrongPassword(password)) {
        throw new Error('Password does not meet security requirements');
      }

      // Hash password
      const hashedPassword = await SecurityConfig.hashPassword(password);

      // Create user
      const userId = uuidv4();
      const insertQuery = `
        INSERT INTO users (id, nationalId, name, email, password, role, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, 'citizen', 'active', NOW(), NOW())
      `;
      
      await db.query(insertQuery, [userId, nationalId, name, email, hashedPassword]);

      // Generate tokens
      const user = { id: userId, nationalId, name, email, role: 'citizen' };
      const tokens = await this.generateTokens(user);

      // Create session
      const sessionId = await this.createSession(userId, tokens.accessToken, {});

      // Log registration
      await this.logUserAction(userId, 'USER_REGISTERED', {});

      return {
        user,
        tokens,
        sessionId
      };

    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async logout(userId, sessionId) {
    try {
      // Invalidate session
      await db.query(
        'UPDATE sessions SET isActive = 0, loggedOutAt = NOW() WHERE id = ? AND userId = ?',
        [sessionId, userId]
      );

      // Log logout
      await this.logUserAction(userId, 'USER_LOGGED_OUT', { sessionId });

      return true;
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  async generateTokens(user) {
    const accessTokenPayload = {
      id: user.id,
      nationalId: user.nationalId,
      name: user.name,
      email: user.email,
      role: user.role,
      type: 'access'
    };

    const refreshTokenPayload = {
      id: user.id,
      type: 'refresh'
    };

    const accessToken = jwt.sign(
      accessTokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    const refreshToken = jwt.sign(
      refreshTokenPayload,
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
  }

  async createSession(userId, token, metadata) {
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours

    const insertQuery = `
      INSERT INTO sessions (id, userId, token, createdAt, expiresAt, lastActivity, isActive, ipAddress, userAgent)
      VALUES (?, ?, ?, NOW(), ?, NOW(), 1, ?, ?)
    `;

    await db.query(insertQuery, [
      sessionId,
      userId,
      token,
      expiresAt,
      metadata.ip || null,
      metadata.userAgent || null
    ]);

    return sessionId;
  }

  async handleFailedLogin(userId, nationalId, metadata) {
    const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
    const lockoutTime = parseInt(process.env.LOCKOUT_TIME) || 30; // minutes

    // Increment failed attempts
    await db.query(
      'UPDATE users SET failedAttempts = failedAttempts + 1 WHERE id = ?',
      [userId]
    );

    // Check if we need to lock the account
    const userQuery = 'SELECT failedAttempts FROM users WHERE id = ?';
    const users = await db.query(userQuery, [userId]);
    
    if (users.length && users[0].failedAttempts >= maxAttempts) {
      const lockedUntil = new Date(Date.now() + (lockoutTime * 60 * 1000));
      await db.query(
        'UPDATE users SET lockedUntil = ? WHERE id = ?',
        [lockedUntil, userId]
      );
    }

    await this.logFailedAttempt(nationalId, 'Invalid password', metadata);
  }

  async resetFailedAttempts(userId) {
    await db.query(
      'UPDATE users SET failedAttempts = 0, lockedUntil = NULL WHERE id = ?',
      [userId]
    );
  }

  async logFailedAttempt(nationalId, reason, metadata) {
    const insertQuery = `
      INSERT INTO audit_logs (id, userId, action, details, ipAddress, userAgent, timestamp)
      VALUES (?, NULL, 'LOGIN_FAILED', ?, ?, ?, NOW())
    `;

    await db.query(insertQuery, [
      uuidv4(),
      JSON.stringify({ nationalId, reason }),
      metadata.ip || null,
      metadata.userAgent || null
    ]);
  }

  async logSuccessfulLogin(userId, metadata) {
    await this.logUserAction(userId, 'LOGIN_SUCCESS', metadata);
  }

  async logUserAction(userId, action, metadata) {
    const insertQuery = `
      INSERT INTO audit_logs (id, userId, action, details, ipAddress, userAgent, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    await db.query(insertQuery, [
      uuidv4(),
      userId,
      action,
      JSON.stringify(metadata),
      metadata.ip || null,
      metadata.userAgent || null
    ]);
  }
}

module.exports = new AuthService();
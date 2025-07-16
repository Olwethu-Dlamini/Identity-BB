const authService = require('../services/authService');
const { validateLogin, validateUserRegistration } = require('../utils/validation');
const { createLogger } = require('../utils/logger');

const logger = createLogger('auth-controller');

class AuthController {
  constructor() {
    this.authService = authService;
  }

  async login(req, res) {
    try {
      const { error } = validateLogin(req.body);
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

      const { nationalId, password } = req.body;
      const metadata = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.requestId
      };

      const result = await this.authService.login(nationalId, password, metadata);

      // Set secure session cookie
      res.cookie('sessionId', result.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      logger.info('User logged in successfully', {
        userId: result.user.id,
        nationalId: result.user.nationalId,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
          expiresIn: 3600 // 1 hour
        }
      });

    } catch (error) {
      logger.error('Login error:', {
        error: error.message,
        nationalId: req.body.nationalId,
        ip: req.ip,
        requestId: req.requestId
      });

      const statusCode = error.message.includes('locked') ? 423 : 401;
      
      res.status(statusCode).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async register(req, res) {
    try {
      const { error } = validateUserRegistration(req.body);
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

      const metadata = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.requestId
      };

      const result = await this.authService.register(req.body, metadata);

      // Set secure session cookie
      res.cookie('sessionId', result.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      logger.info('User registered successfully', {
        userId: result.user.id,
        nationalId: result.user.nationalId,
        ip: req.ip
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
          expiresIn: 3600 // 1 hour
        }
      });

    } catch (error) {
      logger.error('Registration error:', {
        error: error.message,
        nationalId: req.body.nationalId,
        ip: req.ip,
        requestId: req.requestId
      });

      const statusCode = error.message.includes('already exists') ? 409 : 400;
      
      res.status(statusCode).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async logout(req, res) {
    try {
      const sessionId = req.cookies.sessionId;
      const userId = req.user?.id;

      if (sessionId && userId) {
        await this.authService.logout(userId, sessionId);
        
        logger.info('User logged out successfully', {
          userId,
          sessionId,
          ip: req.ip
        });
      }

      res.clearCookie('sessionId');
      
      res.json({
        success: true,
        message: 'Logout successful',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Logout error:', {
        error: error.message,
        userId: req.user?.id,
        ip: req.ip,
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: 'Logout failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      const result = await this.authService.refreshToken(refreshToken);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: result.accessToken,
          expiresIn: 3600 // 1 hour
        }
      });

    } catch (error) {
      logger.error('Token refresh error:', {
        error: error.message,
        ip: req.ip,
        requestId: req.requestId
      });

      res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        timestamp: new Date().toISOString()
      });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      await this.authService.forgotPassword(email);

      res.json({
        success: true,
        message: 'Password reset instructions sent to your email'
      });

    } catch (error) {
      logger.error('Forgot password error:', {
        error: error.message,
        email: req.body.email,
        ip: req.ip
      });

      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: 'Password reset instructions sent to your email'
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Token and new password are required'
        });
      }

      await this.authService.resetPassword(token, newPassword);

      res.json({
        success: true,
        message: 'Password reset successful'
      });

    } catch (error) {
      logger.error('Reset password error:', {
        error: error.message,
        ip: req.ip
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async verifyAccount(req, res) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Verification token is required'
        });
      }

      await this.authService.verifyAccount(token);

      res.json({
        success: true,
        message: 'Account verified successfully'
      });

    } catch (error) {
      logger.error('Account verification error:', {
        error: error.message,
        ip: req.ip
      });

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new AuthController();
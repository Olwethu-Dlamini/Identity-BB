const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const SecurityConfig = require('../config/security');
const { createLogger } = require('../utils/logger');

const logger = createLogger('user-service');

class UserService {
  async createUser(userData) {
    try {
      const { nationalId, name, email, password, role = 'citizen' } = userData;

      // Check if user already exists
      const existingUserQuery = `
        SELECT id FROM users 
        WHERE nationalId = ? OR email = ?
      `;
      
      const existingUsers = await db.query(existingUserQuery, [nationalId, email]);
      
      if (existingUsers.length) {
        throw new Error('User already exists');
      }

      // Hash password
      const hashedPassword = await SecurityConfig.hashPassword(password);

      // Create user
      const userId = uuidv4();
      const insertQuery = `
        INSERT INTO users (id, nationalId, name, email, password, role, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
      `;
      
      await db.query(insertQuery, [userId, nationalId, name, email, hashedPassword, role]);

      // Return user without password
      return {
        id: userId,
        nationalId,
        name,
        email,
        role,
        status: 'active'
      };

    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async findUserByNationalId(nationalId) {
    try {
      const userQuery = `
        SELECT id, nationalId, name, email, password, role, status, 
               failedAttempts, lockedUntil, lastLogin, createdAt
        FROM users 
        WHERE nationalId = ?
      `;
      
      const users = await db.query(userQuery, [nationalId]);
      return users.length ? users[0] : null;

    } catch (error) {
      logger.error('Error finding user by national ID:', error);
      throw error;
    }
  }

  async findUserById(id) {
    try {
      const userQuery = `
        SELECT id, nationalId, name, email, role, status, 
               lastLogin, createdAt, updatedAt
        FROM users 
        WHERE id = ?
      `;
      
      const users = await db.query(userQuery, [id]);
      return users.length ? users[0] : null;

    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  async updateUser(id, updates) {
    try {
      const allowedUpdates = ['name', 'email', 'role', 'status'];
      const updateFields = [];
      const values = [];

      for (const field of allowedUpdates) {
        if (updates[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          values.push(updates[field]);
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(id);

      const updateQuery = `
        UPDATE users 
        SET ${updateFields.join(', ')}, updatedAt = NOW()
        WHERE id = ?
      `;

      await db.query(updateQuery, values);

      return await this.findUserById(id);

    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  async getAllUsers(options = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', role, status, dateFrom, dateTo } = options;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      let params = [];

      if (role) {
        whereClause += ' AND role = ?';
        params.push(role);
      }

      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }

      if (dateFrom) {
        whereClause += ' AND createdAt >= ?';
        params.push(dateFrom);
      }

      if (dateTo) {
        whereClause += ' AND createdAt <= ?';
        params.push(dateTo);
      }

      const query = `
        SELECT id, nationalId, name, email, role, status, 
               lastLogin, createdAt, updatedAt
        FROM users 
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ${limit} OFFSET ${offset}
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM users 
        ${whereClause}
      `;

      const [users, countResult] = await Promise.all([
        db.query(query, params),
        db.query(countQuery, params)
      ]);

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      return {
        users,
        page,
        limit,
        total,
        totalPages
      };

    } catch (error) {
      logger.error('Error getting all users:', error);
      throw error;
    }
  }

  async searchUsers(query, searchBy = 'name') {
    try {
      const searchQuery = `
        SELECT id, nationalId, name, email, role, status, 
               lastLogin, createdAt, updatedAt
        FROM users 
        WHERE ${searchBy} LIKE ?
        ORDER BY name ASC
        LIMIT 50
      `;

      const users = await db.query(searchQuery, [`%${query}%`]);
      return users;

    } catch (error) {
      logger.error('Error searching users:', error);
      throw error;
    }
  }

  async getUserSessions(userId) {
    try {
      const sessionsQuery = `
        SELECT id, createdAt, expiresAt, lastActivity, isActive, 
               ipAddress, userAgent, loggedOutAt
        FROM sessions 
        WHERE userId = ?
        ORDER BY createdAt DESC
      `;
      
      const sessions = await db.query(sessionsQuery, [userId]);
      return sessions;

    } catch (error) {
      logger.error('Error getting user sessions:', error);
      throw error;
    }
  }

  async terminateSession(userId, sessionId) {
    try {
      const updateQuery = `
        UPDATE sessions 
        SET isActive = 0, loggedOutAt = NOW()
        WHERE id = ? AND userId = ?
      `;

      await db.query(updateQuery, [sessionId, userId]);
      return true;

    } catch (error) {
      logger.error('Error terminating session:', error);
      throw error;
    }
  }

  async terminateAllSessions(userId, excludeSessionId = null) {
    try {
      let updateQuery = `
        UPDATE sessions 
        SET isActive = 0, loggedOutAt = NOW()
        WHERE userId = ? AND isActive = 1
      `;
      let params = [userId];

      if (excludeSessionId) {
        updateQuery += ' AND id != ?';
        params.push(excludeSessionId);
      }

      await db.query(updateQuery, params);
      return true;

    } catch (error) {
      logger.error('Error terminating all sessions:', error);
      throw error;
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get current user
      const userQuery = `
        SELECT id, password
        FROM users 
        WHERE id = ?
      `;
      
      const users = await db.query(userQuery, [userId]);
      
      if (!users.length) {
        throw new Error('User not found');
      }

      const user = users[0];

      // Verify current password
      const isValidPassword = await SecurityConfig.verifyPassword(currentPassword, user.password);
      
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password strength
      if (!SecurityConfig.isStrongPassword(newPassword)) {
        throw new Error('New password does not meet security requirements');
      }

      // Hash new password
      const hashedPassword = await SecurityConfig.hashPassword(newPassword);

      // Update password
      const updateQuery = `
        UPDATE users 
        SET password = ?, updatedAt = NOW()
        WHERE id = ?
      `;

      await db.query(updateQuery, [hashedPassword, userId]);

      return true;

    } catch (error) {
      logger.error('Error changing password:', error);
      throw error;
    }
  }

  async lockUser(userId, reason = 'Locked by admin') {
    try {
      const updateQuery = `
        UPDATE users 
        SET status = 'locked', lockedUntil = DATE_ADD(NOW(), INTERVAL 1 HOUR), updatedAt = NOW()
        WHERE id = ?
      `;

      await db.query(updateQuery, [userId]);
      return true;

    } catch (error) {
      logger.error('Error locking user:', error);
      throw error;
    }
  }

  async unlockUser(userId) {
    try {
      const updateQuery = `
        UPDATE users 
        SET status = 'active', lockedUntil = NULL, failedAttempts = 0, updatedAt = NOW()
        WHERE id = ?
      `;

      await db.query(updateQuery, [userId]);
      return true;

    } catch (error) {
      logger.error('Error unlocking user:', error);
      throw error;
    }
  }

  async deleteUser(id) {
    try {
      // Soft delete - just deactivate the user
      const updateQuery = `
        UPDATE users 
        SET status = 'inactive', updatedAt = NOW()
        WHERE id = ?
      `;

      await db.query(updateQuery, [id]);
      return true;

    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  async deleteAccount(userId, password) {
    try {
      // Get current user
      const userQuery = `
        SELECT id, password
        FROM users 
        WHERE id = ?
      `;
      
      const users = await db.query(userQuery, [userId]);
      
      if (!users.length) {
        throw new Error('User not found');
      }

      const user = users[0];

      // Verify password
      const isValidPassword = await SecurityConfig.verifyPassword(password, user.password);
      
      if (!isValidPassword) {
        throw new Error('Password is incorrect');
      }

      // Soft delete
      const updateQuery = `
        UPDATE users 
        SET status = 'inactive', updatedAt = NOW()
        WHERE id = ?
      `;

      await db.query(updateQuery, [userId]);

      // Terminate all sessions
      await this.terminateAllSessions(userId);

      return true;

    } catch (error) {
      logger.error('Error deleting account:', error);
      throw error;
    }
  }

  async getUserActivity(userId, options = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'timestamp', sortOrder = 'desc' } = options;
      const offset = (page - 1) * limit;

      const query = `
        SELECT action, details, timestamp, ipAddress, userAgent
        FROM audit_logs 
        WHERE userId = ?
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ${limit} OFFSET ${offset}
      `;

      const activity = await db.query(query, [userId]);
      return activity;

    } catch (error) {
      logger.error('Error getting user activity:', error);
      throw error;
    }
  }

  async getSystemStats() {
    try {
      const statsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM users) as totalUsers,
          (SELECT COUNT(*) FROM users WHERE status = 'active') as activeUsers,
          (SELECT COUNT(*) FROM users WHERE status = 'locked') as lockedUsers,
          (SELECT COUNT(*) FROM sessions WHERE isActive = 1) as activeSessions,
          (SELECT COUNT(*) FROM audit_logs WHERE DATE(timestamp) = CURDATE()) as todayActions
      `;

      const stats = await db.query(statsQuery);
      return stats[0];

    } catch (error) {
      logger.error('Error getting system stats:', error);
      throw error;
    }
  }
}

module.exports = new UserService();
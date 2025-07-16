const mysql = require('mysql2/promise');
const { createLogger } = require('../utils/logger');

const logger = createLogger('database');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      this.connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'eswatini_sso',
        port: process.env.DB_PORT || 3306
      });

      logger.info('Database connected successfully');
      return this.connection;
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  async query(sql, params = []) {
    try {
      if (!this.connection) {
        await this.connect();
      }

      // Simple query without prepared statements as requested
      let finalSql = sql;
      if (params.length > 0) {
        params.forEach((param) => {
          finalSql = finalSql.replace('?', this.connection.escape(param));
        });
      }

      const [results] = await this.connection.execute(finalSql);
      return results;
    } catch (error) {
      logger.error('Query error:', { sql, error: error.message });
      throw error;
    }
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
      logger.info('Database connection closed');
    }
  }
}

const db = new Database();

async function connectDB() {
  try {
    await db.connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

module.exports = { db, connectDB };
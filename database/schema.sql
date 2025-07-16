-- Eswatini SSO Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS eswatini_sso CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eswatini_sso;

-- Users table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    nationalId VARCHAR(12) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('citizen', 'admin', 'super_admin') DEFAULT 'citizen',
    status ENUM('active', 'inactive', 'suspended', 'locked') DEFAULT 'active',
    failedAttempts INT DEFAULT 0,
    lockedUntil TIMESTAMP NULL,
    lastLogin TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nationalId (nationalId),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_role (role)
);

-- Sessions table
CREATE TABLE sessions (
    id VARCHAR(36) PRIMARY KEY,
    userId VARCHAR(36) NOT NULL,
    token TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiresAt TIMESTAMP NOT NULL,
    lastActivity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    isActive BOOLEAN DEFAULT TRUE,
    ipAddress VARCHAR(45),
    userAgent TEXT,
    loggedOutAt TIMESTAMP NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_userId (userId),
    INDEX idx_isActive (isActive),
    INDEX idx_expiresAt (expiresAt)
);

-- Audit logs table
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    userId VARCHAR(36),
    action VARCHAR(50) NOT NULL,
    details JSON,
    ipAddress VARCHAR(45),
    userAgent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_userId (userId),
    INDEX idx_action (action),
    INDEX idx_timestamp (timestamp)
);

-- User roles table (for future expansion)
CREATE TABLE user_roles (
    id VARCHAR(36) PRIMARY KEY,
    userId VARCHAR(36) NOT NULL,
    role VARCHAR(50) NOT NULL,
    grantedBy VARCHAR(36),
    grantedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiresAt TIMESTAMP NULL,
    isActive BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (grantedBy) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_userId (userId),
    INDEX idx_role (role),
    INDEX idx_isActive (isActive)
);

-- Permissions table (for future expansion)
CREATE TABLE permissions (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100),
    action VARCHAR(50),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role permissions table (for future expansion)
CREATE TABLE role_permissions (
    id VARCHAR(36) PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    permissionId VARCHAR(36) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (permissionId) REFERENCES permissions(id) ON DELETE CASCADE,
    INDEX idx_role (role),
    INDEX idx_permissionId (permissionId)
);

-- Insert default admin user
INSERT INTO users (id, nationalId, name, email, password, role, status, createdAt, updatedAt)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    '199001010001',
    'System Administrator',
    'admin@gov.sz',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqyc.NnRJzZBGhLILgT8MSy', -- password: Admin123!
    'super_admin',
    'active',
    NOW(),
    NOW()
);

-- Insert default permissions
INSERT INTO permissions (id, name, description, resource, action) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'user.read', 'Read user information', 'users', 'read'),
('650e8400-e29b-41d4-a716-446655440002', 'user.write', 'Create and update users', 'users', 'write'),
('650e8400-e29b-41d4-a716-446655440003', 'user.delete', 'Delete users', 'users', 'delete'),
('650e8400-e29b-41d4-a716-446655440004', 'admin.access', 'Access admin panel', 'admin', 'access'),
('650e8400-e29b-41d4-a716-446655440005', 'audit.read', 'Read audit logs', 'audit', 'read'),
('650e8400-e29b-41d4-a716-446655440006', 'session.manage', 'Manage user sessions', 'sessions', 'manage');

-- Create indexes for better performance
CREATE INDEX idx_users_created_at ON users(createdAt);
CREATE INDEX idx_sessions_created_at ON sessions(createdAt);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Create views for reporting
CREATE VIEW active_sessions AS
SELECT 
    s.id,
    s.userId,
    u.name,
    u.nationalId,
    s.createdAt,
    s.lastActivity,
    s.ipAddress,
    s.userAgent
FROM sessions s
JOIN users u ON s.userId = u.id
WHERE s.isActive = TRUE AND s.expiresAt > NOW();

CREATE VIEW user_activity_summary AS
SELECT 
    u.id,
    u.nationalId,
    u.name,
    u.email,
    u.lastLogin,
    u.failedAttempts,
    COUNT(s.id) as total_sessions,
    COUNT(CASE WHEN s.isActive = TRUE THEN 1 END) as active_sessions
FROM users u
LEFT JOIN sessions s ON u.id = s.userId
GROUP BY u.id, u.nationalId, u.name, u.email, u.lastLogin, u.failedAttempts;

-- Insert test user
INSERT INTO users (id, nationalId, name, email, password, role, status, createdAt, updatedAt)
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    '199012345678',
    'John Doe',
    'john@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqyc.NnRJzZBGhLILgT8MSy', -- password: Test123!
    'citizen',
    'active',
    NOW(),
    NOW()
);
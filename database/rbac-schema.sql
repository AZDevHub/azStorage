-- IBM i DB2 for i RBAC Database Schema
-- Version: 1.0.0
-- Description: Complete Role-Based Access Control schema for user management

-- Create library if it doesn't exist
-- CREATE SCHEMA RBACLIB;

-- Set the current schema
-- SET CURRENT SCHEMA = RBACLIB;

-- ============================================
-- SEQUENCES
-- ============================================

-- User ID Sequence
CREATE SEQUENCE RBACLIB.USER_ID_SEQ
    START WITH 1000
    INCREMENT BY 1
    NO MAXVALUE
    NO CYCLE
    CACHE 20;

-- Role ID Sequence
CREATE SEQUENCE RBACLIB.ROLE_ID_SEQ
    START WITH 100
    INCREMENT BY 1
    NO MAXVALUE
    NO CYCLE
    CACHE 20;

-- Permission ID Sequence
CREATE SEQUENCE RBACLIB.PERMISSION_ID_SEQ
    START WITH 1000
    INCREMENT BY 1
    NO MAXVALUE
    NO CYCLE
    CACHE 20;

-- Session ID Sequence
CREATE SEQUENCE RBACLIB.SESSION_ID_SEQ
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO CYCLE
    CACHE 20;

-- Audit ID Sequence
CREATE SEQUENCE RBACLIB.AUDIT_ID_SEQ
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO CYCLE
    CACHE 50;

-- ============================================
-- TABLES
-- ============================================

-- Users Table
CREATE TABLE RBACLIB.USERS (
    user_id INTEGER NOT NULL,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    ibmi_profile VARCHAR(10),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL,
    last_modified_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified_by VARCHAR(50) NOT NULL,
    last_login_date TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    failed_login_count INTEGER DEFAULT 0,
    password_changed_date TIMESTAMP,
    password_expires_date TIMESTAMP,
    deleted_date TIMESTAMP,
    deleted_by VARCHAR(50),
    CONSTRAINT PK_USERS PRIMARY KEY (user_id),
    CONSTRAINT UQ_USERS_USERNAME UNIQUE (username),
    CONSTRAINT UQ_USERS_EMAIL UNIQUE (email),
    CONSTRAINT CK_USERS_STATUS CHECK (status IN ('active', 'inactive', 'suspended', 'deleted'))
);

-- Create indexes for Users table
CREATE INDEX RBACLIB.IX_USERS_USERNAME ON RBACLIB.USERS (username);
CREATE INDEX RBACLIB.IX_USERS_EMAIL ON RBACLIB.USERS (email);
CREATE INDEX RBACLIB.IX_USERS_STATUS ON RBACLIB.USERS (status);
CREATE INDEX RBACLIB.IX_USERS_IBMI_PROFILE ON RBACLIB.USERS (ibmi_profile);

-- Roles Table
CREATE TABLE RBACLIB.ROLES (
    role_id INTEGER NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    is_system CHAR(1) NOT NULL DEFAULT '0',
    priority INTEGER DEFAULT 0,
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL,
    last_modified_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified_by VARCHAR(50) NOT NULL,
    CONSTRAINT PK_ROLES PRIMARY KEY (role_id),
    CONSTRAINT UQ_ROLES_NAME UNIQUE (role_name),
    CONSTRAINT CK_ROLES_IS_SYSTEM CHECK (is_system IN ('0', '1'))
);

-- Create indexes for Roles table
CREATE INDEX RBACLIB.IX_ROLES_NAME ON RBACLIB.ROLES (role_name);
CREATE INDEX RBACLIB.IX_ROLES_PRIORITY ON RBACLIB.ROLES (priority DESC);

-- Permissions Table
CREATE TABLE RBACLIB.PERMISSIONS (
    permission_id INTEGER NOT NULL,
    permission_name VARCHAR(100) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    description VARCHAR(255) NOT NULL,
    is_system CHAR(1) NOT NULL DEFAULT '0',
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL,
    CONSTRAINT PK_PERMISSIONS PRIMARY KEY (permission_id),
    CONSTRAINT UQ_PERMISSIONS_NAME UNIQUE (permission_name),
    CONSTRAINT CK_PERMISSIONS_ACTION CHECK (action IN ('create', 'read', 'update', 'delete', 'execute', 'approve', 'manage')),
    CONSTRAINT CK_PERMISSIONS_IS_SYSTEM CHECK (is_system IN ('0', '1'))
);

-- Create indexes for Permissions table
CREATE INDEX RBACLIB.IX_PERMISSIONS_NAME ON RBACLIB.PERMISSIONS (permission_name);
CREATE INDEX RBACLIB.IX_PERMISSIONS_RESOURCE ON RBACLIB.PERMISSIONS (resource);
CREATE INDEX RBACLIB.IX_PERMISSIONS_ACTION ON RBACLIB.PERMISSIONS (action);

-- User Roles Junction Table
CREATE TABLE RBACLIB.USER_ROLES (
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    assigned_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by VARCHAR(50) NOT NULL,
    expiry_date TIMESTAMP,
    reason VARCHAR(255),
    CONSTRAINT PK_USER_ROLES PRIMARY KEY (user_id, role_id),
    CONSTRAINT FK_USER_ROLES_USER FOREIGN KEY (user_id) 
        REFERENCES RBACLIB.USERS (user_id) ON DELETE CASCADE,
    CONSTRAINT FK_USER_ROLES_ROLE FOREIGN KEY (role_id) 
        REFERENCES RBACLIB.ROLES (role_id) ON DELETE CASCADE
);

-- Create indexes for User Roles table
CREATE INDEX RBACLIB.IX_USER_ROLES_USER ON RBACLIB.USER_ROLES (user_id);
CREATE INDEX RBACLIB.IX_USER_ROLES_ROLE ON RBACLIB.USER_ROLES (role_id);
CREATE INDEX RBACLIB.IX_USER_ROLES_EXPIRY ON RBACLIB.USER_ROLES (expiry_date);

-- Role Permissions Junction Table
CREATE TABLE RBACLIB.ROLE_PERMISSIONS (
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    granted_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    granted_by VARCHAR(50) NOT NULL,
    CONSTRAINT PK_ROLE_PERMISSIONS PRIMARY KEY (role_id, permission_id),
    CONSTRAINT FK_ROLE_PERMISSIONS_ROLE FOREIGN KEY (role_id) 
        REFERENCES RBACLIB.ROLES (role_id) ON DELETE CASCADE,
    CONSTRAINT FK_ROLE_PERMISSIONS_PERMISSION FOREIGN KEY (permission_id) 
        REFERENCES RBACLIB.PERMISSIONS (permission_id) ON DELETE CASCADE
);

-- Create indexes for Role Permissions table
CREATE INDEX RBACLIB.IX_ROLE_PERMISSIONS_ROLE ON RBACLIB.ROLE_PERMISSIONS (role_id);
CREATE INDEX RBACLIB.IX_ROLE_PERMISSIONS_PERMISSION ON RBACLIB.ROLE_PERMISSIONS (permission_id);

-- User Sessions Table
CREATE TABLE RBACLIB.USER_SESSIONS (
    session_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    session_token VARCHAR(500) NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_activity_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP NOT NULL,
    is_active CHAR(1) NOT NULL DEFAULT '1',
    CONSTRAINT PK_USER_SESSIONS PRIMARY KEY (session_id),
    CONSTRAINT UQ_USER_SESSIONS_TOKEN UNIQUE (session_token),
    CONSTRAINT FK_USER_SESSIONS_USER FOREIGN KEY (user_id) 
        REFERENCES RBACLIB.USERS (user_id) ON DELETE CASCADE,
    CONSTRAINT CK_USER_SESSIONS_ACTIVE CHECK (is_active IN ('0', '1'))
);

-- Create indexes for User Sessions table
CREATE INDEX RBACLIB.IX_USER_SESSIONS_USER ON RBACLIB.USER_SESSIONS (user_id);
CREATE INDEX RBACLIB.IX_USER_SESSIONS_TOKEN ON RBACLIB.USER_SESSIONS (session_token);
CREATE INDEX RBACLIB.IX_USER_SESSIONS_EXPIRY ON RBACLIB.USER_SESSIONS (expiry_date);
CREATE INDEX RBACLIB.IX_USER_SESSIONS_ACTIVE ON RBACLIB.USER_SESSIONS (is_active);

-- Audit Log Table
CREATE TABLE RBACLIB.AUDIT_LOG (
    audit_id BIGINT NOT NULL,
    user_id INTEGER,
    username VARCHAR(50),
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(100),
    resource_id VARCHAR(100),
    details CLOB(1M),
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    status VARCHAR(20),
    error_message VARCHAR(500),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_AUDIT_LOG PRIMARY KEY (audit_id)
);

-- Create indexes for Audit Log table
CREATE INDEX RBACLIB.IX_AUDIT_LOG_USER ON RBACLIB.AUDIT_LOG (user_id);
CREATE INDEX RBACLIB.IX_AUDIT_LOG_USERNAME ON RBACLIB.AUDIT_LOG (username);
CREATE INDEX RBACLIB.IX_AUDIT_LOG_ACTION ON RBACLIB.AUDIT_LOG (action);
CREATE INDEX RBACLIB.IX_AUDIT_LOG_RESOURCE ON RBACLIB.AUDIT_LOG (resource);
CREATE INDEX RBACLIB.IX_AUDIT_LOG_TIMESTAMP ON RBACLIB.AUDIT_LOG (timestamp DESC);

-- Password History Table (for password policy enforcement)
CREATE TABLE RBACLIB.PASSWORD_HISTORY (
    user_id INTEGER NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    changed_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(50) NOT NULL,
    CONSTRAINT FK_PASSWORD_HISTORY_USER FOREIGN KEY (user_id) 
        REFERENCES RBACLIB.USERS (user_id) ON DELETE CASCADE
);

-- Create index for Password History table
CREATE INDEX RBACLIB.IX_PASSWORD_HISTORY_USER ON RBACLIB.PASSWORD_HISTORY (user_id);
CREATE INDEX RBACLIB.IX_PASSWORD_HISTORY_DATE ON RBACLIB.PASSWORD_HISTORY (changed_date DESC);

-- API Keys Table (for API authentication)
CREATE TABLE RBACLIB.API_KEYS (
    api_key_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    api_key VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_date TIMESTAMP,
    expiry_date TIMESTAMP,
    is_active CHAR(1) NOT NULL DEFAULT '1',
    allowed_ips VARCHAR(500),
    rate_limit INTEGER DEFAULT 1000,
    CONSTRAINT PK_API_KEYS PRIMARY KEY (api_key_id),
    CONSTRAINT UQ_API_KEYS_KEY UNIQUE (api_key),
    CONSTRAINT FK_API_KEYS_USER FOREIGN KEY (user_id) 
        REFERENCES RBACLIB.USERS (user_id) ON DELETE CASCADE,
    CONSTRAINT CK_API_KEYS_ACTIVE CHECK (is_active IN ('0', '1'))
);

-- Create indexes for API Keys table
CREATE INDEX RBACLIB.IX_API_KEYS_USER ON RBACLIB.API_KEYS (user_id);
CREATE INDEX RBACLIB.IX_API_KEYS_KEY ON RBACLIB.API_KEYS (api_key);
CREATE INDEX RBACLIB.IX_API_KEYS_ACTIVE ON RBACLIB.API_KEYS (is_active);

-- ============================================
-- VIEWS
-- ============================================

-- Active Users View
CREATE VIEW RBACLIB.V_ACTIVE_USERS AS
SELECT 
    u.user_id,
    u.username,
    u.email,
    u.first_name,
    u.last_name,
    u.ibmi_profile,
    u.last_login_date,
    COUNT(DISTINCT ur.role_id) AS role_count,
    LISTAGG(r.role_name, ',') WITHIN GROUP (ORDER BY r.priority DESC) AS roles
FROM RBACLIB.USERS u
LEFT JOIN RBACLIB.USER_ROLES ur ON u.user_id = ur.user_id 
    AND (ur.expiry_date IS NULL OR ur.expiry_date > CURRENT_TIMESTAMP)
LEFT JOIN RBACLIB.ROLES r ON ur.role_id = r.role_id
WHERE u.status = 'active'
GROUP BY u.user_id, u.username, u.email, u.first_name, u.last_name, 
         u.ibmi_profile, u.last_login_date;

-- User Permissions View
CREATE VIEW RBACLIB.V_USER_PERMISSIONS AS
SELECT DISTINCT
    u.user_id,
    u.username,
    p.permission_id,
    p.permission_name,
    p.resource,
    p.action,
    r.role_name AS granted_by_role
FROM RBACLIB.USERS u
JOIN RBACLIB.USER_ROLES ur ON u.user_id = ur.user_id 
    AND (ur.expiry_date IS NULL OR ur.expiry_date > CURRENT_TIMESTAMP)
JOIN RBACLIB.ROLES r ON ur.role_id = r.role_id
JOIN RBACLIB.ROLE_PERMISSIONS rp ON r.role_id = rp.role_id
JOIN RBACLIB.PERMISSIONS p ON rp.permission_id = p.permission_id
WHERE u.status = 'active';

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Procedure to check if user has permission
CREATE PROCEDURE RBACLIB.CHECK_USER_PERMISSION (
    IN p_user_id INTEGER,
    IN p_permission_name VARCHAR(100),
    OUT p_has_permission CHAR(1)
)
LANGUAGE SQL
BEGIN
    SET p_has_permission = '0';
    
    SELECT '1' INTO p_has_permission
    FROM RBACLIB.V_USER_PERMISSIONS
    WHERE user_id = p_user_id 
      AND permission_name = p_permission_name
    FETCH FIRST 1 ROW ONLY;
END;

-- Procedure to clean up expired sessions
CREATE PROCEDURE RBACLIB.CLEANUP_EXPIRED_SESSIONS()
LANGUAGE SQL
BEGIN
    UPDATE RBACLIB.USER_SESSIONS
    SET is_active = '0'
    WHERE expiry_date < CURRENT_TIMESTAMP
      AND is_active = '1';
    
    DELETE FROM RBACLIB.USER_SESSIONS
    WHERE expiry_date < CURRENT_TIMESTAMP - 30 DAYS;
END;

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Insert default system roles
INSERT INTO RBACLIB.ROLES (role_id, role_name, description, is_system, priority, created_by, last_modified_by)
VALUES 
    (1, 'admin', 'System Administrator - Full access', '1', 100, 'SYSTEM', 'SYSTEM'),
    (2, 'user_manager', 'User Manager - Can manage users and roles', '1', 80, 'SYSTEM', 'SYSTEM'),
    (3, 'viewer', 'Viewer - Read-only access', '1', 20, 'SYSTEM', 'SYSTEM'),
    (4, 'user', 'Standard User - Basic access', '1', 10, 'SYSTEM', 'SYSTEM');

-- Insert default permissions
INSERT INTO RBACLIB.PERMISSIONS (permission_id, permission_name, resource, action, description, is_system, created_by)
VALUES 
    -- User permissions
    (1, 'users.create', 'users', 'create', 'Create new users', '1', 'SYSTEM'),
    (2, 'users.read', 'users', 'read', 'View user information', '1', 'SYSTEM'),
    (3, 'users.update', 'users', 'update', 'Update user information', '1', 'SYSTEM'),
    (4, 'users.delete', 'users', 'delete', 'Delete users', '1', 'SYSTEM'),
    -- Role permissions
    (5, 'roles.create', 'roles', 'create', 'Create new roles', '1', 'SYSTEM'),
    (6, 'roles.read', 'roles', 'read', 'View role information', '1', 'SYSTEM'),
    (7, 'roles.update', 'roles', 'update', 'Update role information', '1', 'SYSTEM'),
    (8, 'roles.delete', 'roles', 'delete', 'Delete roles', '1', 'SYSTEM'),
    (9, 'roles.manage', 'roles', 'manage', 'Assign/remove roles from users', '1', 'SYSTEM'),
    -- Permission permissions
    (10, 'permissions.create', 'permissions', 'create', 'Create new permissions', '1', 'SYSTEM'),
    (11, 'permissions.read', 'permissions', 'read', 'View permission information', '1', 'SYSTEM'),
    (12, 'permissions.update', 'permissions', 'update', 'Update permission information', '1', 'SYSTEM'),
    (13, 'permissions.delete', 'permissions', 'delete', 'Delete permissions', '1', 'SYSTEM'),
    (14, 'permissions.manage', 'permissions', 'manage', 'Assign/remove permissions from roles', '1', 'SYSTEM'),
    -- System permissions
    (15, 'system.manage', 'system', 'manage', 'Manage system configuration', '1', 'SYSTEM'),
    (16, 'audit.read', 'audit', 'read', 'View audit logs', '1', 'SYSTEM'),
    (17, 'api.manage', 'api', 'manage', 'Manage API keys and access', '1', 'SYSTEM');

-- Assign permissions to admin role (all permissions)
INSERT INTO RBACLIB.ROLE_PERMISSIONS (role_id, permission_id, granted_by)
SELECT 1, permission_id, 'SYSTEM'
FROM RBACLIB.PERMISSIONS;

-- Assign permissions to user_manager role
INSERT INTO RBACLIB.ROLE_PERMISSIONS (role_id, permission_id, granted_by)
VALUES 
    (2, 1, 'SYSTEM'), -- users.create
    (2, 2, 'SYSTEM'), -- users.read
    (2, 3, 'SYSTEM'), -- users.update
    (2, 6, 'SYSTEM'), -- roles.read
    (2, 9, 'SYSTEM'), -- roles.manage
    (2, 11, 'SYSTEM'); -- permissions.read

-- Assign permissions to viewer role
INSERT INTO RBACLIB.ROLE_PERMISSIONS (role_id, permission_id, granted_by)
VALUES 
    (3, 2, 'SYSTEM'), -- users.read
    (3, 6, 'SYSTEM'), -- roles.read
    (3, 11, 'SYSTEM'); -- permissions.read

-- Assign permissions to user role
INSERT INTO RBACLIB.ROLE_PERMISSIONS (role_id, permission_id, granted_by)
VALUES 
    (4, 2, 'SYSTEM'); -- users.read (own profile only - handled in app logic)

-- Create default admin user (password should be changed on first login)
-- Password: Admin123! (this should be hashed in production)
INSERT INTO RBACLIB.USERS (
    user_id, username, email, password_hash, 
    first_name, last_name, status, 
    created_by, last_modified_by
)
VALUES (
    1, 'admin', 'admin@company.com', 
    '$2b$10$YourHashedPasswordHere', -- Replace with actual bcrypt hash
    'System', 'Administrator', 'active', 
    'SYSTEM', 'SYSTEM'
);

-- Assign admin role to admin user
INSERT INTO RBACLIB.USER_ROLES (user_id, role_id, assigned_by)
VALUES (1, 1, 'SYSTEM');

-- ============================================
-- GRANTS (adjust based on your IBM i security model)
-- ============================================

-- Grant appropriate permissions to application user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON RBACLIB.* TO APPLICATION_USER;
-- GRANT EXECUTE ON PROCEDURE RBACLIB.CHECK_USER_PERMISSION TO APPLICATION_USER;
-- GRANT EXECUTE ON PROCEDURE RBACLIB.CLEANUP_EXPIRED_SESSIONS TO APPLICATION_USER;
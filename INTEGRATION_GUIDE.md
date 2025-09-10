# IBM i Dynamic REST API Server - Integration Guide

## Table of Contents
1. [Security Audit Results](#security-audit-results)
2. [Critical Security Fixes Required](#critical-security-fixes-required)
3. [Integration Requirements](#integration-requirements)
4. [Implementation Best Practices](#implementation-best-practices)
5. [Performance Optimization](#performance-optimization)
6. [RBAC Implementation Guide](#rbac-implementation-guide)
7. [IBM i Specific Considerations](#ibm-i-specific-considerations)

---

## Security Audit Results

### Critical Vulnerabilities Identified

#### 1. SQL Injection Risk (CRITICAL)
**Location**: `src/utils/SqlParameterReplacer.js`
- **Issue**: Direct string concatenation for SQL queries
- **Risk Level**: CRITICAL
- **Impact**: Complete database compromise possible

**Fix Required**:
```javascript
// Instead of string concatenation
const sql = `SELECT * FROM users WHERE id = '${userId}'`;

// Use parameterized queries
const sql = 'SELECT * FROM users WHERE id = ?';
const params = [userId];
await connection.query(sql, params);
```

#### 2. Missing Authentication Middleware (HIGH)
**Location**: All API endpoints
- **Issue**: No JWT validation or API key verification
- **Risk Level**: HIGH
- **Impact**: Unauthorized access to all endpoints

**Fix Required**: Implement authentication middleware
```javascript
// src/middleware/auth.js
import jwt from 'jsonwebtoken';

export const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
```

#### 3. Input Validation Issues (MEDIUM)
**Location**: Route parameter handling
- **Issue**: No schema validation for request bodies
- **Risk Level**: MEDIUM
- **Impact**: Data integrity issues, potential crashes

**Fix Required**: Add JSON schema validation
```javascript
import Ajv from 'ajv';
const ajv = new Ajv();

export const validateRequest = (schema) => {
    return (req, res, next) => {
        const valid = ajv.validate(schema, req.body);
        if (!valid) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: ajv.errors 
            });
        }
        next();
    };
};
```

#### 4. Error Information Disclosure (LOW)
**Location**: Error responses
- **Issue**: Stack traces exposed in production
- **Risk Level**: LOW
- **Impact**: Information leakage

**Fix Required**: Sanitize error messages
```javascript
const errorHandler = (err, req, res, next) => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(err.status || 500).json({
        error: err.message,
        ...(isDevelopment && { stack: err.stack })
    });
};
```

#### 5. Missing Rate Limiting (MEDIUM)
**Location**: All endpoints
- **Issue**: No request throttling
- **Risk Level**: MEDIUM
- **Impact**: DoS vulnerability

**Fix Required**: Implement rate limiting
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

---

## Critical Security Fixes Required

### Immediate Actions (Priority 1)

1. **Replace SQL Parameter Replacement**
```javascript
// File: src/services/DatabaseService.js
async query(sql, params = []) {
    if (!this.pool) {
        throw new Error('Database not initialized');
    }
    
    try {
        const connection = await this.pool.connect();
        // Use parameterized queries
        const result = await connection.query(sql, params);
        await connection.close();
        
        return {
            success: true,
            data: result,
            rowCount: result.length
        };
    } catch (error) {
        // Log error securely
        logger.error('Database query failed', { sql, error: error.message });
        throw new DatabaseError('Query execution failed');
    }
}
```

2. **Add Authentication Middleware**
```javascript
// File: src/middleware/auth.js
import jwt from 'jsonwebtoken';
import { DatabaseService } from '../services/DatabaseService.js';

export class AuthMiddleware {
    constructor(dbService) {
        this.db = dbService;
    }
    
    async authenticate(req, res, next) {
        try {
            const token = this.extractToken(req);
            if (!token) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Verify user still exists and is active
            const user = await this.db.query(
                'SELECT user_id, username, status FROM RBACLIB.USERS WHERE user_id = ?',
                [decoded.userId]
            );
            
            if (!user.data.length || user.data[0].status !== 'active') {
                return res.status(401).json({ error: 'Invalid user' });
            }
            
            req.user = user.data[0];
            next();
        } catch (error) {
            return res.status(401).json({ error: 'Authentication failed' });
        }
    }
    
    extractToken(req) {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        return req.headers['x-api-key'];
    }
}
```

3. **Implement Authorization Checks**
```javascript
// File: src/middleware/rbac.js
export class RBACMiddleware {
    constructor(dbService) {
        this.db = dbService;
    }
    
    requirePermission(permission) {
        return async (req, res, next) => {
            try {
                const hasPermission = await this.checkPermission(
                    req.user.user_id, 
                    permission
                );
                
                if (!hasPermission) {
                    return res.status(403).json({ 
                        error: 'Insufficient permissions' 
                    });
                }
                
                next();
            } catch (error) {
                return res.status(500).json({ 
                    error: 'Authorization check failed' 
                });
            }
        };
    }
    
    async checkPermission(userId, permission) {
        const result = await this.db.query(
            `SELECT COUNT(*) as has_permission
             FROM RBACLIB.V_USER_PERMISSIONS
             WHERE user_id = ? AND permission_name = ?`,
            [userId, permission]
        );
        
        return result.data[0].has_permission > 0;
    }
}
```

---

## Integration Requirements

### Environment Variables
```bash
# .env file
NODE_ENV=production
PORT=3000

# Database
DB_CONNECTION_STRING=Driver={iSeries Access ODBC Driver};System=YOUR_SYSTEM;Uid=YOUR_USER;Pwd=YOUR_PASSWORD;
DB_POOL_SIZE=10
DB_POOL_TIMEOUT=30000

# IBM i Configuration
IBMI_SYSTEM=YOUR_SYSTEM
IBMI_LIBRARY=RBACLIB
IBMI_NAMING=sql

# Security
JWT_SECRET=your-256-bit-secret-key-here
JWT_EXPIRY=1h
BCRYPT_ROUNDS=10
API_KEY_HEADER=X-API-Key

# CORS
CORS_ORIGIN=https://your-frontend.com
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/api-server.log
```

### Package Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "odbc": "^2.4.8",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "ajv": "^8.12.0",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "winston": "^3.11.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "@types/node": "^20.10.5"
  }
}
```

### Updated Server Configuration
```javascript
// src/server.js - Security enhancements
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AuthMiddleware } from './middleware/auth.js';
import { RBACMiddleware } from './middleware/rbac.js';

class DynamicApiServer {
    setupMiddleware() {
        // Security headers
        this.app.use(helmet());
        
        // Rate limiting
        const limiter = rateLimit({
            windowMs: process.env.RATE_LIMIT_WINDOW || 900000,
            max: process.env.RATE_LIMIT_MAX || 100
        });
        this.app.use('/api/', limiter);
        
        // CORS with credentials
        this.app.use(cors({
            origin: process.env.CORS_ORIGIN,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
        }));
        
        // Body parsing with limits
        this.app.use(express.json({ limit: '1mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '1mb' }));
        
        // Initialize auth middleware
        this.authMiddleware = new AuthMiddleware(this.dbService);
        this.rbacMiddleware = new RBACMiddleware(this.dbService);
    }
}
```

---

## Implementation Best Practices

### 1. Database Connection Management
```javascript
// Implement connection pooling with proper configuration
const poolConfig = {
    connectionString: process.env.DB_CONNECTION_STRING,
    connectionTimeout: 30000,
    loginTimeout: 30000,
    initialSize: 5,
    incrementSize: 2,
    maxSize: parseInt(process.env.DB_POOL_SIZE) || 10,
    shrink: true,
    shrinkPeriodMinutes: 15,
    reuseConnections: true
};
```

### 2. Logging Strategy
```javascript
// Use Winston for structured logging
import winston from 'winston';

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ 
            filename: 'error.log', 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: 'combined.log' 
        })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}
```

### 3. Error Handling Pattern
```javascript
class ApiError extends Error {
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
    }
}

// Global error handler
app.use((err, req, res, next) => {
    logger.error('Error occurred', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });
    
    if (err.isOperational) {
        res.status(err.statusCode).json({
            error: err.message,
            code: err.code
        });
    } else {
        res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR'
        });
    }
});
```

### 4. Request Validation Pattern
```javascript
// Create validation schemas for each endpoint
const schemas = {
    createUser: {
        type: 'object',
        required: ['username', 'email', 'password', 'firstName', 'lastName'],
        properties: {
            username: { 
                type: 'string', 
                minLength: 3, 
                maxLength: 50,
                pattern: '^[a-zA-Z0-9_-]+$'
            },
            email: { 
                type: 'string', 
                format: 'email' 
            },
            password: { 
                type: 'string', 
                minLength: 8 
            },
            firstName: { 
                type: 'string', 
                maxLength: 100 
            },
            lastName: { 
                type: 'string', 
                maxLength: 100 
            }
        }
    }
};
```

---

## Performance Optimization

### 1. Query Optimization
```sql
-- Use proper indexes
CREATE INDEX IX_USERS_STATUS_LOGIN 
ON RBACLIB.USERS (status, last_login_date DESC);

-- Use covering indexes for frequently accessed columns
CREATE INDEX IX_USER_PERMISSIONS_LOOKUP 
ON RBACLIB.V_USER_PERMISSIONS (user_id, permission_name) 
INCLUDE (resource, action);
```

### 2. Caching Strategy
```javascript
// Implement Redis caching for permissions
import Redis from 'ioredis';

class PermissionCache {
    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT
        });
    }
    
    async getPermissions(userId) {
        const key = `permissions:${userId}`;
        const cached = await this.redis.get(key);
        
        if (cached) {
            return JSON.parse(cached);
        }
        
        const permissions = await this.fetchFromDatabase(userId);
        await this.redis.setex(key, 300, JSON.stringify(permissions));
        
        return permissions;
    }
}
```

### 3. Response Compression
```javascript
import compression from 'compression';

app.use(compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    level: 6
}));
```

---

## RBAC Implementation Guide

### 1. User Registration Flow
```javascript
// POST /usermanagement/api/users
async createUser(userData) {
    // 1. Validate input
    const valid = ajv.validate(schemas.createUser, userData);
    if (!valid) throw new ValidationError(ajv.errors);
    
    // 2. Check for duplicates
    const existing = await this.db.query(
        'SELECT COUNT(*) as count FROM RBACLIB.USERS WHERE username = ? OR email = ?',
        [userData.username, userData.email]
    );
    if (existing.data[0].count > 0) {
        throw new ConflictError('Username or email already exists');
    }
    
    // 3. Hash password
    const passwordHash = await bcrypt.hash(userData.password, 10);
    
    // 4. Insert user
    const userId = await this.db.query(
        `INSERT INTO RBACLIB.USERS (user_id, username, email, password_hash, 
         first_name, last_name, status, created_by, last_modified_by) 
         VALUES (NEXT VALUE FOR RBACLIB.USER_ID_SEQ, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        [userData.username, userData.email, passwordHash, 
         userData.firstName, userData.lastName, req.user.username, req.user.username]
    );
    
    // 5. Assign default role
    await this.db.query(
        'INSERT INTO RBACLIB.USER_ROLES (user_id, role_id, assigned_by) VALUES (?, 4, ?)',
        [userId, req.user.username]
    );
    
    // 6. Audit log
    await this.auditLog('USER_CREATED', userId, req);
    
    return { success: true, userId };
}
```

### 2. Authentication Flow
```javascript
// POST /auth/login
async login(credentials) {
    // 1. Find user
    const user = await this.db.query(
        'SELECT * FROM RBACLIB.USERS WHERE username = ? AND status = ?',
        [credentials.username, 'active']
    );
    
    if (!user.data.length) {
        throw new UnauthorizedError('Invalid credentials');
    }
    
    // 2. Verify password
    const valid = await bcrypt.compare(
        credentials.password, 
        user.data[0].password_hash
    );
    
    if (!valid) {
        // Update failed login count
        await this.db.query(
            'UPDATE RBACLIB.USERS SET failed_login_count = failed_login_count + 1 WHERE user_id = ?',
            [user.data[0].user_id]
        );
        throw new UnauthorizedError('Invalid credentials');
    }
    
    // 3. Generate JWT
    const token = jwt.sign(
        { 
            userId: user.data[0].user_id,
            username: user.data[0].username 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY }
    );
    
    // 4. Update login info
    await this.db.query(
        `UPDATE RBACLIB.USERS 
         SET last_login_date = CURRENT_TIMESTAMP, 
             login_count = login_count + 1,
             failed_login_count = 0 
         WHERE user_id = ?`,
        [user.data[0].user_id]
    );
    
    // 5. Create session
    await this.db.query(
        `INSERT INTO RBACLIB.USER_SESSIONS 
         (session_id, user_id, session_token, ip_address, user_agent, expiry_date) 
         VALUES (NEXT VALUE FOR RBACLIB.SESSION_ID_SEQ, ?, ?, ?, ?, ?)`,
        [user.data[0].user_id, token, req.ip, req.headers['user-agent'], 
         new Date(Date.now() + 3600000)]
    );
    
    return { token, user: user.data[0] };
}
```

### 3. Permission Checking
```javascript
// Middleware for route protection
app.get('/admin/users', 
    authMiddleware.authenticate,
    rbacMiddleware.requirePermission('users.read'),
    async (req, res) => {
        // Route handler
    }
);

// Dynamic permission checking
async function canUserPerform(userId, resource, action) {
    const permission = `${resource}.${action}`;
    const result = await db.query(
        `SELECT COUNT(*) as allowed
         FROM RBACLIB.V_USER_PERMISSIONS
         WHERE user_id = ? AND permission_name = ?`,
        [userId, permission]
    );
    
    return result.data[0].allowed > 0;
}
```

---

## IBM i Specific Considerations

### 1. ODBC Configuration
```javascript
// IBM i specific connection string
const connectionString = [
    'Driver={iSeries Access ODBC Driver}',
    `System=${process.env.IBMI_SYSTEM}`,
    `Uid=${process.env.IBMI_USER}`,
    `Pwd=${process.env.IBMI_PASSWORD}`,
    'Naming=1',  // Use SQL naming convention
    'CommitMode=2',  // Read uncommitted
    'ConnectionType=2',  // Use connection pooling
    'DefaultLibraries=RBACLIB,QGPL',
    'DBQ=RBACLIB'
].join(';');
```

### 2. IBM i User Profile Integration
```javascript
// Sync with IBM i user profiles
async function syncWithIBMiProfile(username) {
    const result = await db.query(
        `SELECT * FROM QSYS2.USER_INFO 
         WHERE AUTHORIZATION_NAME = ?`,
        [username.toUpperCase()]
    );
    
    if (result.data.length) {
        // Update local user with IBM i profile info
        await db.query(
            `UPDATE RBACLIB.USERS 
             SET ibmi_profile = ?, 
                 last_modified_date = CURRENT_TIMESTAMP 
             WHERE username = ?`,
            [username.toUpperCase(), username]
        );
    }
}
```

### 3. DB2 for i Optimization
```sql
-- Use RCAC (Row and Column Access Control) for additional security
CREATE PERMISSION RBACLIB.USER_SELF_ACCESS
ON RBACLIB.USERS
FOR ROWS WHERE user_id = SESSION_USER
ENFORCED FOR ALL ACCESS
ENABLE;

-- Use temporal tables for audit trails
ALTER TABLE RBACLIB.USERS
ADD SYSTEM_TIME PERIOD (row_start, row_end);

CREATE TABLE RBACLIB.USERS_HISTORY LIKE RBACLIB.USERS;

ALTER TABLE RBACLIB.USERS
ADD VERSIONING USE HISTORY TABLE RBACLIB.USERS_HISTORY;
```

### 4. Performance Monitoring
```sql
-- Monitor query performance
SELECT 
    CURRENT_TIMESTAMP as snapshot_time,
    JOB_NAME,
    AUTHORIZATION_NAME,
    SQL_STATEMENT_TEXT,
    TOTAL_EXECUTION_TIME,
    TOTAL_ROWS_FETCHED
FROM QSYS2.ACTIVE_SQL_MONITOR
WHERE AUTHORIZATION_NAME = 'API_USER'
  AND TOTAL_EXECUTION_TIME > 1000
ORDER BY TOTAL_EXECUTION_TIME DESC
FETCH FIRST 10 ROWS ONLY;
```

---

## Testing Requirements

### 1. Security Testing
```javascript
// Test SQL injection prevention
describe('SQL Injection Prevention', () => {
    it('should safely handle malicious input', async () => {
        const maliciousInput = "'; DROP TABLE USERS; --";
        const response = await request(app)
            .get(`/api/users/${maliciousInput}`)
            .expect(400);
        
        expect(response.body.error).toBe('Invalid user ID format');
    });
});
```

### 2. Load Testing
```bash
# Use Apache Bench for load testing
ab -n 1000 -c 10 -H "Authorization: Bearer YOUR_TOKEN" \
   http://localhost:3000/api/users

# Or use k6 for more complex scenarios
k6 run load-test.js
```

### 3. Integration Testing
```javascript
// Test complete user flow
describe('User Management Flow', () => {
    let authToken;
    let userId;
    
    beforeAll(async () => {
        // Login as admin
        const loginResponse = await request(app)
            .post('/auth/login')
            .send({ username: 'admin', password: 'Admin123!' });
        
        authToken = loginResponse.body.token;
    });
    
    it('should create a new user', async () => {
        const response = await request(app)
            .post('/usermanagement/api/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'Test123!',
                firstName: 'Test',
                lastName: 'User'
            })
            .expect(201);
        
        userId = response.body.id;
        expect(userId).toBeDefined();
    });
    
    it('should assign role to user', async () => {
        await request(app)
            .post(`/usermanagement/api/users/${userId}/roles`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ roleId: 4 })
            .expect(201);
    });
    
    it('should verify user permissions', async () => {
        const response = await request(app)
            .get(`/usermanagement/api/users/${userId}/permissions/users.read`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        
        expect(response.body.has_permission).toBe(true);
    });
});
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All security vulnerabilities addressed
- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] SSL certificates configured
- [ ] Rate limiting configured
- [ ] Logging configured
- [ ] Error handling tested
- [ ] Load testing completed

### Post-Deployment
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify authentication flow
- [ ] Test all RBAC endpoints
- [ ] Verify IBM i integration
- [ ] Check audit logging
- [ ] Monitor resource usage

---

## Support and Maintenance

### Regular Maintenance Tasks
1. **Daily**: Check error logs and failed login attempts
2. **Weekly**: Review audit logs and performance metrics
3. **Monthly**: Clean up expired sessions and old audit logs
4. **Quarterly**: Review and update security configurations

### Monitoring Commands
```sql
-- Check active sessions
SELECT COUNT(*) as active_sessions 
FROM RBACLIB.USER_SESSIONS 
WHERE is_active = '1' AND expiry_date > CURRENT_TIMESTAMP;

-- Check failed login attempts
SELECT username, failed_login_count, last_login_date
FROM RBACLIB.USERS
WHERE failed_login_count > 3
ORDER BY failed_login_count DESC;

-- Monitor API performance
SELECT 
    DATE(timestamp) as date,
    action,
    COUNT(*) as request_count,
    AVG(response_time) as avg_response_time
FROM RBACLIB.AUDIT_LOG
WHERE timestamp > CURRENT_DATE - 7 DAYS
GROUP BY DATE(timestamp), action
ORDER BY date DESC, request_count DESC;
```

---

This integration guide provides a comprehensive roadmap for implementing a secure, scalable, and maintainable IBM i REST API server with RBAC capabilities.
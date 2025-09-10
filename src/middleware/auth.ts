import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { BasicStrategy } from 'passport-http';
import { Strategy as BearerStrategy } from 'passport-http-bearer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { DatabaseService } from '../services/DatabaseService.js';
import type { AuthConfig } from '../types/route.types.js';

/**
 * User interface
 */
export interface User {
  id: string | number;
  username: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
}

/**
 * JWT Payload
 */
export interface JWTPayload {
  userId: string | number;
  username: string;
  roles?: string[];
  iat?: number;
  exp?: number;
}

/**
 * Authentication Middleware
 * Handles JWT, Basic Auth, and Bearer token authentication
 */
export class AuthMiddleware {
  private dbService: DatabaseService;
  private config: AuthConfig & {
    basicAuthRealm?: string;
    userRolesTable?: string;
  };

  constructor(databaseService: DatabaseService, config: Partial<AuthConfig> = {}) {
    this.dbService = databaseService;
    this.config = {
      jwtSecret: config.jwtSecret || process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      jwtExpiry: config.jwtExpiry || '24h',
      basicAuthRealm: 'IBM i API',
      enableBasicAuth: config.enableBasicAuth !== false,
      enableBearerAuth: config.enableBearerAuth !== false,
      usersTable: config.usersTable || 'USERS',
      rolesTable: config.rolesTable || 'ROLES',
      permissionsTable: config.permissionsTable || 'PERMISSIONS',
      userRolesTable: 'USER_ROLES'
    };
    
    this.setupPassport();
  }

  /**
   * Setup Passport strategies
   */
  private setupPassport(): void {
    // Basic Authentication Strategy
    if (this.config.enableBasicAuth) {
      passport.use(new BasicStrategy(async (username, password, done) => {
        try {
          const user = await this.validateUser(username, password);
          if (!user) {
            return done(null, false);
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }));
    }

    // Bearer Token Strategy
    if (this.config.enableBearerAuth) {
      passport.use(new BearerStrategy(async (token, done) => {
        try {
          const decoded = jwt.verify(token, this.config.jwtSecret) as JWTPayload;
          const user = await this.getUserById(decoded.userId);
          if (!user) {
            return done(null, false);
          }
          return done(null, user);
        } catch (error) {
          return done(null, false);
        }
      }));
    }
  }

  /**
   * Validate user credentials
   */
  private async validateUser(username: string, password: string): Promise<User | null> {
    try {
      const query = `SELECT * FROM ${this.config.usersTable} WHERE username = ? OR email = ?`;
      const result = await this.dbService.executeQuery(query, [username, username]);
      
      if (!result.success || !result.data || result.data.length === 0) {
        return null;
      }
      
      const user = result.data[0];
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return null;
      }
      
      // Get user roles
      const roles = await this.getUserRoles(user.id);
      
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        roles
      };
    } catch (error) {
      console.error('Error validating user:', error);
      return null;
    }
  }

  /**
   * Get user by ID
   */
  private async getUserById(userId: string | number): Promise<User | null> {
    try {
      const query = `SELECT * FROM ${this.config.usersTable} WHERE id = ?`;
      const result = await this.dbService.executeQuery(query, [userId]);
      
      if (!result.success || !result.data || result.data.length === 0) {
        return null;
      }
      
      const user = result.data[0];
      const roles = await this.getUserRoles(user.id);
      
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        roles
      };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  /**
   * Get user roles
   */
  private async getUserRoles(userId: string | number): Promise<string[]> {
    try {
      const query = `
        SELECT r.name 
        FROM ${this.config.rolesTable} r
        JOIN ${this.config.userRolesTable} ur ON r.id = ur.role_id
        WHERE ur.user_id = ?
      `;
      const result = await this.dbService.executeQuery(query, [userId]);
      
      if (!result.success || !result.data) {
        return [];
      }
      
      return result.data.map((row: any) => row.name);
    } catch (error) {
      console.error('Error getting user roles:', error);
      return [];
    }
  }

  /**
   * Generate JWT token
   */
  public generateToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      roles: user.roles
    };
    
    return jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.jwtExpiry
    } as jwt.SignOptions);
  }

  /**
   * Verify JWT token
   */
  public verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.config.jwtSecret) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Hash password
   */
  public async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  /**
   * Basic auth middleware
   */
  public basicAuth() {
    return passport.authenticate('basic', { session: false }) as any;
  }

  /**
   * Bearer auth middleware
   */
  public bearerAuth() {
    return passport.authenticate('bearer', { session: false }) as any;
  }

  /**
   * JWT auth middleware (custom implementation)
   */
  public jwtAuth() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        res.status(401).json({ error: 'No authorization header' });
        return;
      }
      
      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;
      
      const decoded = this.verifyToken(token);
      if (!decoded) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }
      
      (req as any).user = decoded;
      next();
    };
  }

  /**
   * Role-based access control middleware
   */
  public requireRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const user = (req as any).user;
      
      if (!user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }
      
      if (!user.roles || !roles.some(role => user.roles.includes(role))) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }
      
      next();
    };
  }

  /**
   * API key authentication middleware
   */
  public apiKeyAuth(validKeys: string[] | ((key: string) => boolean)) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const apiKey = req.headers['x-api-key'] as string;
      
      if (!apiKey) {
        res.status(401).json({ error: 'API key required' });
        return;
      }
      
      const isValid = Array.isArray(validKeys) 
        ? validKeys.includes(apiKey)
        : validKeys(apiKey);
      
      if (!isValid) {
        res.status(401).json({ error: 'Invalid API key' });
        return;
      }
      
      next();
    };
  }

  /**
   * Optional auth middleware (auth not required but user info extracted if present)
   */
  public optionalAuth() {
    return (req: Request, _res: Response, next: NextFunction): void => {
      const authHeader = req.headers.authorization;
      
      if (authHeader) {
        const token = authHeader.startsWith('Bearer ') 
          ? authHeader.slice(7) 
          : authHeader;
        
        const decoded = this.verifyToken(token);
        if (decoded) {
          (req as any).user = decoded;
        }
      }
      
      next();
    };
  }
}

export default AuthMiddleware;

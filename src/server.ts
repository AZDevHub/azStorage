import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { DatabaseService } from './services/DatabaseService.js';
import { ApiService } from './services/ApiService.js';
import { RouteManager } from './routers/RouteManager.js';
import { ApiDocRouter } from './routers/ApiDocRouter.js';
import { ServerConfig } from './types/route.types.js';

// Load environment variables
dotenv.config();

/**
 * Dynamic API Server for IBM i
 * TypeScript implementation with manual route registration
 */
class DynamicApiServer {
  private app: Express;
  private port: number;
  private config: ServerConfig;
  private dbService: DatabaseService | null = null;
  private apiService: ApiService | null = null;
  private routeManager: RouteManager | null = null;
  private apiDocRouter: ApiDocRouter | null = null;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.config = this.loadConfig();
  }

  /**
   * Load server configuration
   */
  private loadConfig(): ServerConfig {
    return {
      port: this.port,
      corsOrigin: process.env.CORS_ORIGIN || '*',
      database: {
        connectionString: process.env.DB_CONNECTION_STRING || '',
        env: process.env.MAPICS_ENV || 'QQ',
        libraries: process.env[process.env.MAPICS_ENV || 'QQ'] || 'QSYS2',
        cistools: process.env.CISTOOLS,
        poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10),
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '600', 10)
      },
      auth: {
        jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        jwtExpiry: process.env.JWT_EXPIRY || '24h',
        enableBasicAuth: process.env.ENABLE_BASIC_AUTH !== 'false',
        enableBearerAuth: process.env.ENABLE_BEARER_AUTH !== 'false',
        usersTable: process.env.USERS_TABLE || 'USERS',
        rolesTable: process.env.ROLES_TABLE || 'ROLES',
        permissionsTable: process.env.PERMISSIONS_TABLE || 'PERMISSIONS'
      },
      tables: {
        users: process.env.USERS_TABLE || 'USERS',
        roles: process.env.ROLES_TABLE || 'ROLES',
        permissions: process.env.PERMISSIONS_TABLE || 'PERMISSIONS'
      },
      ibmi: {
        system: process.env.IBMI_SYSTEM || 'localhost',
        library: process.env.IBMI_LIBRARY || 'QSYS2',
        naming: (process.env.IBMI_NAMING as 'sql' | 'system') || 'sql'
      },
      api: {
        basePath: process.env.API_BASE_PATH || '/',
        version: process.env.API_VERSION || '1.0.0',
        title: process.env.API_TITLE || 'IBM i Dynamic REST API',
        description: process.env.API_DESCRIPTION || 'Dynamic REST API server for IBM i systems'
      }
    };
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // CORS configuration
    this.app.use(cors({
      origin: this.config.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    });

    this.app.use('/api/', limiter);

    // Error handling middleware
    this.app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('❌ Error:', err);
      res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Initialize database service
   */
  private async initializeDatabase(): Promise<void> {
    try {
      console.log('🔧 Initializing database service...');
      this.dbService = new DatabaseService(this.config.database);

      if (process.env.SKIP_DB_INIT === 'true') {
        console.log('⏭️ SKIP_DB_INIT=true - Skipping database pool initialization');
      } else {
        await this.dbService.initialize();
        console.log('✅ Database service initialized');
      }
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Initialize services
   */
  private async initializeServices(): Promise<void> {
    if (!this.dbService) {
      throw new Error('Database service not initialized');
    }

    // Initialize API service
    this.apiService = new ApiService(this.dbService, this.config);
    console.log('✅ API service initialized');

    // Initialize route manager
    this.routeManager = new RouteManager(this.app, this.apiService);
    console.log('✅ Route manager initialized');

    // Initialize documentation router
    this.apiDocRouter = new ApiDocRouter();
    console.log('✅ Documentation router initialized');
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', async (_req: Request, res: Response) => {
      try {
        const health = await this.apiService?.healthCheck();
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: health?.database,
          uptime: process.uptime()
        });
      } catch (error: any) {
        res.status(503).json({
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Routes information endpoint
    this.app.get('/routes', (_req: Request, res: Response) => {
      const stats = this.routeManager?.getRouteStatistics();
      res.json({
        message: 'Available routes',
        statistics: stats,
        routes: this.routeManager?.getRegisteredRoutes().map(r => ({
          method: r.method,
          path: r.path,
          description: r.config.description,
          app: r.app.name
        }))
      });
    });

    // Documentation routes
    if (this.apiDocRouter) {
      this.app.use('/docs', this.apiDocRouter.getRouter());
    }

    // Register all API routes from manual configuration
    if (this.routeManager) {
      this.routeManager.registerAllRoutes();
    }

    // 404 handler
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({
        error: 'Route not found',
        message: 'The requested endpoint does not exist',
        availableEndpoints: '/routes'
      });
    });
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      console.log('🚀 Starting IBM i Dynamic REST API Server...');
      console.log('📋 Configuration:', {
        environment: this.config.database.env,
        port: this.port,
        libraries: this.config.database.libraries
      });

      // Setup middleware
      this.setupMiddleware();

      // Initialize database
      await this.initializeDatabase();

      // Initialize services
      await this.initializeServices();

      // Setup routes
      this.setupRoutes();

      // Start listening
      this.app.listen(this.port, () => {
        console.log('✅ Server started successfully');
        console.log(`🌐 API running at: http://localhost:${this.port}`);
        console.log(`📚 Documentation at: http://localhost:${this.port}/docs/ui`);
        console.log(`📊 OpenAPI spec at: http://localhost:${this.port}/docs/openapi.json`);
        console.log(`🔍 Scalar docs at: http://localhost:${this.port}/docs/reference`);
        console.log(`💡 View routes at: http://localhost:${this.port}/routes`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('🛑 Shutting down server...');
    
    if (this.dbService) {
      await this.dbService.close();
    }
    
    process.exit(0);
  }
}

// Create and start the server
const server = new DynamicApiServer();

// Handle shutdown signals
process.on('SIGINT', () => server.shutdown());
process.on('SIGTERM', () => server.shutdown());

// Start the server
server.start().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

export default DynamicApiServer;

import { Express, Request, Response, NextFunction, Router } from 'express';
import type { RouteRegistration, RouteConfig } from '../types/route.types.js';
import { routes, getAvailableApps, getRoutesGroupedByApp } from '../config/routes.js';
import ApiService from '../services/ApiService.js';
import type { RequestData } from '../utils/SqlParameterReplacer.js';

/**
 * Enhanced Route Manager
 * Handles manual route registration with full TypeScript support
 */
export class RouteManager {
  private app: Express;
  private apiService: ApiService;
  private registeredRoutes: Map<string, RouteRegistration>;

  constructor(app: Express, apiService: ApiService) {
    this.app = app;
    this.apiService = apiService;
    this.registeredRoutes = new Map();
  }

  /**
   * Register all routes from the manual configuration
   */
  public registerAllRoutes(): void {
    console.log('Registering routes from manual configuration...');
    
    for (const route of routes) {
      this.registerRoute(route);
    }
    
    console.log(`✅ Registered ${this.registeredRoutes.size} routes successfully`);
  }

  /**
   * Register a single route
   */
  private registerRoute(registration: RouteRegistration): void {
    const { path, method, config } = registration;
    const routeKey = `${method}:${path}`;
    
    // Prevent duplicate registration
    if (this.registeredRoutes.has(routeKey)) {
      console.warn(`Route already registered: ${routeKey}`);
      return;
    }
    
    // Create the route handler
    const handler = this.createRouteHandler(config);
    
    // Register with Express based on method
    switch (method) {
      case 'GET':
        this.app.get(path, handler);
        break;
      case 'POST':
        this.app.post(path, handler);
        break;
      case 'PUT':
        this.app.put(path, handler);
        break;
      case 'DELETE':
        this.app.delete(path, handler);
        break;
      case 'PATCH':
        this.app.patch(path, handler);
        break;
      case 'HEAD':
        this.app.head(path, handler);
        break;
      case 'OPTIONS':
        this.app.options(path, handler);
        break;
      default:
        console.warn(`Unsupported HTTP method: ${method}`);
        return;
    }
    
    this.registeredRoutes.set(routeKey, registration);
    console.log(`📍 Registered route: ${method} ${path} (${config.description || 'No description'})`);
  }

  /**
   * Create a route handler for the given configuration
   */
  private createRouteHandler(config: RouteConfig) {
    return async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
      try {
        // Build request data from Express request
        const requestData: RequestData = {
          path: req.params,
          query: req.query as Record<string, any>,
          body: req.body,
          headers: req.headers as Record<string, any>
        };
        
        // Execute the route through ApiService
        const result = await this.apiService.executeRoute(config, requestData);
        
        // Set response content type
        const contentType = config.response?.contentType || 'application/json';
        res.setHeader('Content-Type', contentType);
        
        // Send response
        if (contentType === 'application/json') {
          res.json(result);
        } else {
          res.send(result);
        }
      } catch (error: any) {
        // Error handling
        console.error(`Error in route ${config.method} ${config.path}:`, error);
        
        // Check if it's a validation error
        if (error.validationErrors) {
          res.status(400).json({
            error: 'Validation failed',
            details: error.validationErrors
          });
          return;
        }
        
        // Check for specific error codes
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Internal server error';
        
        res.status(statusCode).json({
          error: message,
          path: config.path,
          method: config.method,
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  /**
   * Get all registered routes
   */
  public getRegisteredRoutes(): RouteRegistration[] {
    return Array.from(this.registeredRoutes.values());
  }

  /**
   * Get routes for a specific app
   */
  public getAppRoutes(appName: string): RouteRegistration[] {
    return Array.from(this.registeredRoutes.values())
      .filter(route => route.app.name === appName);
  }

  /**
   * Create a router for a specific app (useful for sub-applications)
   */
  public createAppRouter(appName: string): Router {
    const router = Router();
    const appRoutes = this.getAppRoutes(appName);
    
    for (const route of appRoutes) {
      const handler = this.createRouteHandler(route.config);
      
      switch (route.method) {
        case 'GET':
          router.get(route.path, handler);
          break;
        case 'POST':
          router.post(route.path, handler);
          break;
        case 'PUT':
          router.put(route.path, handler);
          break;
        case 'DELETE':
          router.delete(route.path, handler);
          break;
        case 'PATCH':
          router.patch(route.path, handler);
          break;
      }
    }
    
    return router;
  }

  /**
   * Get route statistics
   */
  public getRouteStatistics(): {
    total: number;
    byMethod: Record<string, number>;
    byApp: Record<string, number>;
  } {
    const stats = {
      total: this.registeredRoutes.size,
      byMethod: {} as Record<string, number>,
      byApp: {} as Record<string, number>
    };
    
    for (const route of this.registeredRoutes.values()) {
      // Count by method
      stats.byMethod[route.method] = (stats.byMethod[route.method] || 0) + 1;
      
      // Count by app
      stats.byApp[route.app.name] = (stats.byApp[route.app.name] || 0) + 1;
    }
    
    return stats;
  }

  /**
   * Find a route by method and path pattern
   */
  public findRoute(method: string, path: string): RouteRegistration | undefined {
    const routeKey = `${method.toUpperCase()}:${path}`;
    return this.registeredRoutes.get(routeKey);
  }

  /**
   * Reload routes (for development)
   */
  public reloadRoutes(): void {
    console.log('Reloading routes...');
    
    // Clear existing routes
    this.registeredRoutes.clear();
    
    // Re-register all routes
    this.registerAllRoutes();
  }

  /**
   * Generate route documentation
   */
  public generateRouteDocumentation(): string {
    const grouped = getRoutesGroupedByApp();
    let doc = '# API Routes Documentation\n\n';
    
    for (const [appName, appRoutes] of Object.entries(grouped)) {
      const app = getAvailableApps().find(a => a.name === appName);
      doc += `## ${app?.displayName || appName}\n`;
      doc += `${app?.description || 'No description'}\n\n`;
      
      for (const route of appRoutes) {
        doc += `### ${route.method} ${route.path}\n`;
        doc += `${route.config.description || 'No description'}\n`;
        
        if (route.config.parameters) {
          doc += '\n**Parameters:**\n';
          
          if (route.config.parameters.path) {
            doc += '- Path parameters:\n';
            for (const [name, param] of Object.entries(route.config.parameters.path)) {
              doc += `  - \`${name}\`: ${param.type} ${param.required ? '(required)' : '(optional)'} - ${param.description}\n`;
            }
          }
          
          if (route.config.parameters.query) {
            doc += '- Query parameters:\n';
            for (const [name, param] of Object.entries(route.config.parameters.query)) {
              doc += `  - \`${name}\`: ${param.type} ${param.required ? '(required)' : '(optional)'} - ${param.description}\n`;
            }
          }
          
          if (route.config.parameters.body) {
            doc += '- Body parameters:\n';
            for (const [name, param] of Object.entries(route.config.parameters.body)) {
              doc += `  - \`${name}\`: ${param.type} ${param.required ? '(required)' : '(optional)'} - ${param.description}\n`;
            }
          }
        }
        
        doc += '\n---\n\n';
      }
    }
    
    return doc;
  }
}

export default RouteManager;

import type { RouteConfig } from '../types/route.types.js';
import SqlParameterReplacer, { RequestData } from '../utils/SqlParameterReplacer.js';
import type { DatabaseService } from './DatabaseService.js';
import type { ServerConfig } from '../types/route.types.js';

/**
 * API Response structure
 */
export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  details?: any;
  statusCode: number;
  contentType?: string;
  count?: number;
}

/**
 * API Service
 * Orchestrates route execution with database operations
 */
export class ApiService {
  private db: DatabaseService;
  private sqlReplacer: SqlParameterReplacer;
  // @ts-ignore - config is used for future functionality
  private config: Partial<ServerConfig>;

  constructor(databaseService: DatabaseService, config: Partial<ServerConfig> = {}) {
    this.db = databaseService;
    this.sqlReplacer = new SqlParameterReplacer(config);
    this.config = config;
  }

  /**
   * Execute a route configuration with the provided request data
   */
  public async executeRoute(routeConfig: RouteConfig, requestData: RequestData): Promise<ApiResponse> {
    try {
      // Validate required parameters
      const validationErrors = this.sqlReplacer.validateParameters(routeConfig, requestData);
      if (validationErrors.length > 0) {
        return {
          success: false,
          error: 'Validation failed',
          details: validationErrors,
          statusCode: 400
        };
      }

      // Apply default values and type coercion
      const processedData = this.sqlReplacer.applyDefaults(routeConfig, requestData);
      const coercedData = this.sqlReplacer.coerceParameters(routeConfig, processedData);

      // Check if route has SQL to execute
      if (!routeConfig.sql) {
        return {
          success: false,
          error: 'No SQL query defined for this route',
          statusCode: 501
        };
      }

      // Replace SQL parameters
      const { sql } = this.sqlReplacer.replaceParameters(
        routeConfig.sql,
        routeConfig.parameterMappings || {},
        coercedData
      );

      // Execute the SQL query
      const result = await this.executeQuery(sql, routeConfig);

      if (!result.success) {
        return {
          success: false,
          error: 'Database query failed',
          details: result.error,
          statusCode: 500
        };
      }

      // Format response based on route configuration
      return this.formatResponse(result.data, routeConfig);

    } catch (error: any) {
      console.error('Error executing route:', error);
      return {
        success: false,
        error: 'Internal server error',
        details: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Execute SQL query with optional library list
   */
  private async executeQuery(sql: string, routeConfig: RouteConfig): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Check if route specifies library list
      const libraryList = (routeConfig as any).libraryList;
      
      if (libraryList && Array.isArray(libraryList)) {
        // Use enhanced database service method if available
        if ('queryWithLibraries' in this.db) {
          return await (this.db as any).queryWithLibraries(sql, [], libraryList);
        }
      }
      
      // Execute regular query
      return await this.db.executeQuery(sql);
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Format response based on route configuration
   */
  private formatResponse(data: any, routeConfig: RouteConfig): ApiResponse {
    const response: ApiResponse = {
      success: true,
      data: data,
      statusCode: 200,
      contentType: routeConfig.response?.contentType || 'application/json'
    };

    // Handle different response types
    if (routeConfig.response?.type === 'array') {
      // Ensure data is an array
      if (!Array.isArray(data)) {
        response.data = [data];
      }
      response.count = Array.isArray(data) ? data.length : 1;
    } else if (routeConfig.response?.type === 'object') {
      // If expecting single object but got array, return first item
      if (Array.isArray(data)) {
        response.data = data.length > 0 ? data[0] : null;
        if (!response.data) {
          response.statusCode = 404;
          response.success = false;
          response.error = 'Resource not found';
          delete response.data;
        }
      }
    } else if (routeConfig.response?.type === 'string') {
      // Convert to string if needed
      response.data = String(data);
    } else if (routeConfig.response?.type === 'number') {
      // Convert to number if needed
      response.data = Number(data);
    } else if (routeConfig.response?.type === 'boolean') {
      // Convert to boolean
      response.data = Boolean(data);
    }

    return response;
  }

  /**
   * Perform health check
   */
  public async healthCheck(): Promise<{ healthy: boolean; database?: string; timestamp: string }> {
    const dbHealth = await this.db.healthCheck();
    return {
      healthy: dbHealth.healthy,
      database: dbHealth.status,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Execute raw SQL (for administrative purposes)
   */
  public async executeRawSql(sql: string, parameters: any[] = []): Promise<ApiResponse> {
    try {
      const result = await this.db.executeQuery(sql, parameters);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Query execution failed',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: result.data,
        statusCode: 200,
        contentType: 'application/json'
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to execute SQL',
        details: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get database statistics
   */
  public async getDatabaseStats(): Promise<any> {
    if ('getConnectionStats' in this.db) {
      return await (this.db as any).getConnectionStats();
    }
    return {
      message: 'Database statistics not available'
    };
  }
}

export default ApiService;

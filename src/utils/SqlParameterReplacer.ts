import type { RouteConfig, SqlParameterValue, SqlParameters } from '../types/route.types.js';
import type { ServerConfig } from '../types/route.types.js';

/**
 * Request data structure for parameter replacement
 */
export interface RequestData {
  path?: Record<string, any>;
  query?: Record<string, any>;
  body?: Record<string, any>;
  headers?: Record<string, any>;
}

/**
 * Result of SQL parameter replacement
 */
export interface ReplacementResult {
  sql: string;
  parameters: SqlParameters;
}

/**
 * SQL Parameter Replacer
 * Handles dynamic SQL parameter replacement using {{parameter}} syntax
 */
export class SqlParameterReplacer {
  private config: Partial<ServerConfig>;

  constructor(config: Partial<ServerConfig> = {}) {
    this.config = config;
  }

  /**
   * Replace parameters in SQL string with values from request data
   */
  public replaceParameters(
    sql: string,
    parameterMappings: Record<string, string>,
    requestData: RequestData
  ): ReplacementResult {
    let processedSql = sql;
    const replacedParams: SqlParameters = {};

    for (const [paramName, mapping] of Object.entries(parameterMappings)) {
      const value = this.getValueFromMapping(mapping, requestData);
      replacedParams[paramName] = value;

      // Replace all occurrences of {{paramName}} in the SQL
      const paramRegex = new RegExp(`\\{\\{${this.escapeRegex(paramName)}\\}\\}`, 'g');
      processedSql = processedSql.replace(paramRegex, this.formatValue(value));
    }

    console.log('SQL Parameter Replacement:', {
      originalSql: sql,
      processedSql: processedSql,
      replacedParams: replacedParams
    });

    return {
      sql: processedSql,
      parameters: replacedParams
    };
  }

  /**
   * Get value from mapping path
   */
  private getValueFromMapping(mapping: string, requestData: RequestData): SqlParameterValue {
    const parts = mapping.split('.');

    // Handle config references
    if (parts[0] === 'config') {
      return this.getNestedValue(this.config, parts.slice(1));
    }

    // Handle request data (path, query, body, headers)
    return this.getNestedValue(requestData, parts);
  }

  /**
   * Get nested value from object using path array
   */
  private getNestedValue(obj: any, path: string[]): SqlParameterValue {
    const result = path.reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);

    // Ensure we return a valid SqlParameterValue type
    if (result === null || result === undefined) {
      return null;
    }

    if (typeof result === 'string' || typeof result === 'number' || typeof result === 'boolean') {
      return result;
    }

    // Convert complex types to string
    return JSON.stringify(result);
  }

  /**
   * Format value for SQL insertion
   * IMPORTANT: This is for direct string replacement, not parameterized queries
   * Use with caution and always validate input
   */
  private formatValue(value: SqlParameterValue): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }

    if (typeof value === 'string') {
      // Escape single quotes for SQL safety
      return `'${this.escapeSqlString(value)}'`;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value.toString();
    }

    // This shouldn't happen due to our type constraints, but handle it anyway
    return `'${this.escapeSqlString(String(value))}'`;
  }

  /**
   * Escape single quotes in SQL strings
   */
  private escapeSqlString(value: string): string {
    return value.replace(/'/g, "''");
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Validate required parameters
   */
  public validateParameters(routeConfig: RouteConfig, requestData: RequestData): string[] {
    const errors: string[] = [];

    if (!routeConfig.parameters) {
      return errors;
    }

    // Check required path parameters
    if (routeConfig.parameters.path) {
      for (const [paramName, paramConfig] of Object.entries(routeConfig.parameters.path)) {
        if (paramConfig.required && (!requestData.path || !requestData.path[paramName])) {
          errors.push(`Required path parameter '${paramName}' is missing`);
        }
      }
    }

    // Check required query parameters
    if (routeConfig.parameters.query) {
      for (const [paramName, paramConfig] of Object.entries(routeConfig.parameters.query)) {
        if (paramConfig.required && (!requestData.query || !requestData.query[paramName])) {
          errors.push(`Required query parameter '${paramName}' is missing`);
        }
      }
    }

    // Check required body parameters
    if (routeConfig.parameters.body) {
      for (const [paramName, paramConfig] of Object.entries(routeConfig.parameters.body)) {
        if (paramConfig.required && (!requestData.body || !requestData.body[paramName])) {
          errors.push(`Required body parameter '${paramName}' is missing`);
        }
      }
    }

    // Check required header parameters
    if (routeConfig.parameters.headers) {
      for (const [paramName, paramConfig] of Object.entries(routeConfig.parameters.headers)) {
        if (paramConfig.required && (!requestData.headers || !requestData.headers[paramName])) {
          errors.push(`Required header '${paramName}' is missing`);
        }
      }
    }

    return errors;
  }

  /**
   * Apply default values to parameters
   */
  public applyDefaults(routeConfig: RouteConfig, requestData: RequestData): RequestData {
    const result = { ...requestData };

    if (!routeConfig.parameters) {
      return result;
    }

    // Apply defaults for query parameters
    if (routeConfig.parameters.query) {
      result.query = result.query || {};
      for (const [paramName, paramConfig] of Object.entries(routeConfig.parameters.query)) {
        if (paramConfig.default !== undefined && result.query[paramName] === undefined) {
          result.query[paramName] = paramConfig.default;
        }
      }
    }

    // Apply defaults for body parameters
    if (routeConfig.parameters.body) {
      result.body = result.body || {};
      for (const [paramName, paramConfig] of Object.entries(routeConfig.parameters.body)) {
        if (paramConfig.default !== undefined && result.body[paramName] === undefined) {
          result.body[paramName] = paramConfig.default;
        }
      }
    }

    return result;
  }

  /**
   * Type-check and coerce parameters
   */
  public coerceParameters(routeConfig: RouteConfig, requestData: RequestData): RequestData {
    const result = { ...requestData };

    if (!routeConfig.parameters) {
      return result;
    }

    // Helper function to coerce values
    const coerceValue = (value: any, type: string): any => {
      switch (type) {
        case 'number':
          return Number(value);
        case 'boolean':
          return value === 'true' || value === true || value === '1' || value === 1;
        case 'string':
          return String(value);
        case 'array':
          return Array.isArray(value) ? value : [value];
        default:
          return value;
      }
    };

    // Coerce path parameters
    if (routeConfig.parameters.path && result.path) {
      for (const [paramName, paramConfig] of Object.entries(routeConfig.parameters.path)) {
        if (result.path[paramName] !== undefined) {
          result.path[paramName] = coerceValue(result.path[paramName], paramConfig.type);
        }
      }
    }

    // Coerce query parameters
    if (routeConfig.parameters.query && result.query) {
      for (const [paramName, paramConfig] of Object.entries(routeConfig.parameters.query)) {
        if (result.query[paramName] !== undefined) {
          result.query[paramName] = coerceValue(result.query[paramName], paramConfig.type);
        }
      }
    }

    // Coerce body parameters
    if (routeConfig.parameters.body && result.body) {
      for (const [paramName, paramConfig] of Object.entries(routeConfig.parameters.body)) {
        if (result.body[paramName] !== undefined) {
          result.body[paramName] = coerceValue(result.body[paramName], paramConfig.type);
        }
      }
    }

    return result;
  }
}

export default SqlParameterReplacer;

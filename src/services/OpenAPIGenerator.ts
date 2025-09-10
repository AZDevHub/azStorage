import type { OpenAPISpec, OpenAPIInfo, RouteConfig, AppMetadata } from '../types/route.types.js';
import { routes, getAvailableApps, getAppRoutes, getAppMetadata } from '../config/routes.js';
import { toTitleCase } from '../utils/stringHelpers.js';

/**
 * OpenAPI 3.0 Specification Generator
 * Generates OpenAPI specs from route configurations
 */
export class OpenAPIGenerator {
  private baseInfo: OpenAPIInfo;
  private servers: Array<{ url: string; description?: string }>;

  constructor() {
    this.baseInfo = {
      title: 'IBM i Dynamic REST API',
      version: '1.0.0',
      description: 'Dynamic REST API server for IBM i systems with config-driven routes',
      contact: {
        name: 'API Support',
        email: 'api-support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    };

    this.servers = [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: 'Development server'
      }
    ];
  }

  /**
   * Generate complete OpenAPI specification for all routes
   */
  public generateOpenAPISpec(appName?: string): OpenAPISpec {
    const routesToDocument = appName 
      ? getAppRoutes(appName)
      : routes;

    if (appName && routesToDocument.length === 0) {
      throw new Error(`No routes found for app: ${appName}`);
    }

    const appMetadata = appName ? getAppMetadata(appName) : null;
    
    const spec: OpenAPISpec = {
      openapi: '3.0.3',
      info: this.generateInfo(appMetadata),
      servers: this.servers,
      paths: {},
      components: {
        schemas: {},
        securitySchemes: this.generateSecuritySchemes(),
        responses: this.generateCommonResponses()
      },
      tags: this.generateTags(appName)
    };

    // Generate paths from routes
    for (const route of routesToDocument) {
      this.addRouteToSpec(spec, route.config);
    }

    return spec;
  }

  /**
   * Generate info section
   */
  private generateInfo(appMetadata?: AppMetadata | null): OpenAPIInfo {
    if (appMetadata) {
      return {
        ...this.baseInfo,
        title: `${appMetadata.displayName} API`,
        description: appMetadata.description || this.baseInfo.description,
        version: appMetadata.version || this.baseInfo.version
      };
    }
    return this.baseInfo;
  }

  /**
   * Generate tags for grouping endpoints
   */
  private generateTags(appName?: string): Array<{ name: string; description?: string }> {
    if (appName) {
      const app = getAppMetadata(appName);
      if (app && app.tags) {
        return app.tags.map(tag => ({ 
          name: tag,
          description: `${app.displayName} - ${tag}` 
        }));
      }
    }

    // Generate tags for all apps
    const tags: Array<{ name: string; description?: string }> = [];
    const apps = getAvailableApps();
    
    for (const app of apps) {
      tags.push({
        name: app.displayName,
        description: app.description
      });
      
      // Add sub-tags if defined
      if (app.tags) {
        for (const tag of app.tags) {
          if (!tags.find(t => t.name === tag)) {
            tags.push({ name: tag });
          }
        }
      }
    }

    return tags;
  }

  /**
   * Add a route to the OpenAPI spec
   */
  private addRouteToSpec(spec: OpenAPISpec, route: RouteConfig): void {
    const path = this.convertPathToOpenAPI(route.path);
    
    if (!spec.paths[path]) {
      spec.paths[path] = {};
    }

    const method = route.method.toLowerCase();
    const operation: any = {
      summary: route.summary || route.description,
      description: route.description,
      operationId: route.operationId || this.generateOperationId(route),
      tags: route.tags || [toTitleCase(route.app || 'default')],
      parameters: this.generateParameters(route),
      responses: this.generateResponses(route)
    };

    // Add request body if needed
    if (['post', 'put', 'patch'].includes(method) && route.parameters?.body) {
      operation.requestBody = this.generateRequestBody(route);
    }

    // Add security requirements
    if (route.requiresAuth || route.security) {
      operation.security = this.generateSecurityRequirements(route);
    }

    // Add deprecation flag
    if (route.deprecated) {
      operation.deprecated = true;
    }

    spec.paths[path][method] = operation;
  }

  /**
   * Convert Express path to OpenAPI path format
   */
  private convertPathToOpenAPI(path: string): string {
    // Convert :param to {param}
    return path.replace(/:(\w+)/g, '{$1}');
  }

  /**
   * Generate operation ID from route
   */
  private generateOperationId(route: RouteConfig): string {
    const method = route.method.toLowerCase();
    const pathParts = route.path
      .split('/')
      .filter(p => p && !p.startsWith(':'))
      .map(p => p.charAt(0).toUpperCase() + p.slice(1));
    
    return `${method}${pathParts.join('')}`;
  }

  /**
   * Generate parameters for a route
   */
  private generateParameters(route: RouteConfig): any[] {
    const parameters: any[] = [];

    if (!route.parameters) {
      return parameters;
    }

    // Path parameters
    if (route.parameters.path) {
      for (const [name, param] of Object.entries(route.parameters.path)) {
        parameters.push({
          name,
          in: 'path',
          required: param.required !== false,
          description: param.description,
          schema: this.generateParameterSchema(param)
        });
      }
    }

    // Query parameters
    if (route.parameters.query) {
      for (const [name, param] of Object.entries(route.parameters.query)) {
        parameters.push({
          name,
          in: 'query',
          required: param.required === true,
          description: param.description,
          schema: this.generateParameterSchema(param)
        });
      }
    }

    // Header parameters
    if (route.parameters.headers) {
      for (const [name, param] of Object.entries(route.parameters.headers)) {
        parameters.push({
          name,
          in: 'header',
          required: param.required === true,
          description: param.description,
          schema: this.generateParameterSchema(param)
        });
      }
    }

    return parameters;
  }

  /**
   * Generate parameter schema
   */
  private generateParameterSchema(param: any): any {
    const schema: any = {
      type: param.type || 'string'
    };

    if (param.enum) {
      schema.enum = param.enum;
    }

    if (param.default !== undefined) {
      schema.default = param.default;
    }

    if (param.example !== undefined) {
      schema.example = param.example;
    }

    if (param.minLength !== undefined) {
      schema.minLength = param.minLength;
    }

    if (param.maxLength !== undefined) {
      schema.maxLength = param.maxLength;
    }

    if (param.minimum !== undefined) {
      schema.minimum = param.minimum;
    }

    if (param.maximum !== undefined) {
      schema.maximum = param.maximum;
    }

    if (param.pattern) {
      schema.pattern = param.pattern;
    }

    return schema;
  }

  /**
   * Generate request body
   */
  private generateRequestBody(route: RouteConfig): any {
    if (!route.parameters?.body) {
      return undefined;
    }

    const properties: any = {};
    const required: string[] = [];

    for (const [name, param] of Object.entries(route.parameters.body)) {
      properties[name] = this.generateParameterSchema(param);
      if (param.required) {
        required.push(name);
      }
    }

    return {
      description: 'Request body',
      required: required.length > 0,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties,
            required: required.length > 0 ? required : undefined
          }
        }
      }
    };
  }

  /**
   * Generate responses
   */
  private generateResponses(route: RouteConfig): any {
    const responses: any = {
      '200': {
        description: 'Successful response',
        content: {}
      }
    };

    // Add content type
    const contentType = route.response?.contentType || 'application/json';
    responses['200'].content[contentType] = {
      schema: this.generateResponseSchema(route)
    };

    // Add error responses
    if (route.errors) {
      for (const error of route.errors) {
        responses[String(error.code)] = {
          description: error.description,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string' },
                  details: { type: 'string' }
                }
              }
            }
          }
        };
      }
    } else {
      // Add default error responses
      responses['400'] = { $ref: '#/components/responses/BadRequest' };
      responses['401'] = { $ref: '#/components/responses/Unauthorized' };
      responses['404'] = { $ref: '#/components/responses/NotFound' };
      responses['500'] = { $ref: '#/components/responses/InternalServerError' };
    }

    return responses;
  }

  /**
   * Generate response schema
   */
  private generateResponseSchema(route: RouteConfig): any {
    if (route.response?.schema) {
      return route.response.schema;
    }

    const type = route.response?.type || 'object';
    
    if (type === 'array') {
      return {
        type: 'array',
        items: {
          type: 'object'
        }
      };
    }

    return {
      type
    };
  }

  /**
   * Generate security schemes
   */
  private generateSecuritySchemes(): any {
    return {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      basicAuth: {
        type: 'http',
        scheme: 'basic'
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      }
    };
  }

  /**
   * Generate common responses
   */
  private generateCommonResponses(): any {
    return {
      BadRequest: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
                details: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      },
      Unauthorized: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string', example: 'Unauthorized' }
              }
            }
          }
        }
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string', example: 'Resource not found' }
              }
            }
          }
        }
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string', example: 'Internal server error' },
                details: { type: 'string' }
              }
            }
          }
        }
      }
    };
  }

  /**
   * Generate security requirements
   */
  private generateSecurityRequirements(route: RouteConfig): any[] {
    if (route.security) {
      return route.security.map(scheme => ({ [scheme]: [] }));
    }

    // Default to bearer auth if requiresAuth is true
    if (route.requiresAuth) {
      return [{ bearerAuth: [] }];
    }

    return [];
  }

  /**
   * List available apps
   */
  public static listAvailableApps(): string[] {
    return getAvailableApps().map(app => app.name);
  }
}

export default OpenAPIGenerator;

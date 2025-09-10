/**
 * Type definitions for route configurations and API structure
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface ParameterDefinition {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  default?: any;
  enum?: string[];
  example?: any;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
}

export interface RouteParameters {
  path?: Record<string, ParameterDefinition>;
  query?: Record<string, ParameterDefinition>;
  body?: Record<string, ParameterDefinition>;
  headers?: Record<string, ParameterDefinition>;
}

export interface ResponseDefinition {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  contentType?: string;
  schema?: any;
  examples?: Record<string, any>;
}

export interface ErrorResponse {
  code: number;
  description: string;
  example?: any;
}

export interface RouteConfig {
  // Core route configuration
  path: string;
  method: HttpMethod;
  description: string;
  summary?: string;
  tags?: string[];
  operationId?: string;
  
  // Parameters
  parameters?: RouteParameters;
  
  // SQL and database
  sql?: string;
  parameterMappings?: Record<string, string>;
  
  // Response configuration
  response?: ResponseDefinition;
  errors?: ErrorResponse[];
  
  // Security
  security?: string[];
  requiresAuth?: boolean;
  roles?: string[];
  
  // Metadata
  app?: string;
  configFile?: string;
  deprecated?: boolean;
  
  // Rate limiting
  rateLimit?: {
    windowMs?: number;
    max?: number;
  };
}

export interface AppMetadata {
  name: string;
  displayName: string; // Title case version for documentation
  description?: string;
  version?: string;
  tags?: string[];
}

export interface RouteRegistration {
  path: string;
  method: HttpMethod;
  config: RouteConfig;
  app: AppMetadata;
}

export interface DatabaseConfig {
  connectionString: string;
  env?: string;
  libraries?: string;
  cistools?: string;
  poolSize?: number;
  connectionTimeout?: number;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiry: string;
  enableBasicAuth: boolean;
  enableBearerAuth: boolean;
  usersTable: string;
  rolesTable?: string;
  permissionsTable?: string;
}

export interface ServerConfig {
  port: number;
  corsOrigin: string | string[];
  database: DatabaseConfig;
  auth: AuthConfig;
  tables: Record<string, string>;
  ibmi?: {
    system: string;
    library: string;
    naming: 'sql' | 'system';
  };
  api?: {
    basePath?: string;
    version?: string;
    title?: string;
    description?: string;
  };
}

export interface OpenAPIInfo {
  title: string;
  version: string;
  description?: string;
  termsOfService?: string;
  contact?: {
    name?: string;
    url?: string;
    email?: string;
  };
  license?: {
    name: string;
    url?: string;
  };
}

export interface OpenAPIServer {
  url: string;
  description?: string;
  variables?: Record<string, {
    default: string;
    description?: string;
    enum?: string[];
  }>;
}

export interface OpenAPISpec {
  openapi: string;
  info: OpenAPIInfo;
  servers?: OpenAPIServer[];
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
    parameters?: Record<string, any>;
    responses?: Record<string, any>;
  };
  security?: Array<Record<string, string[]>>;
  tags?: Array<{
    name: string;
    description?: string;
  }>;
}

// Type guards
export function isRouteConfig(obj: any): obj is RouteConfig {
  return obj &&
    typeof obj.path === 'string' &&
    typeof obj.method === 'string' &&
    ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(obj.method);
}

export function hasParameters(config: RouteConfig): boolean {
  return !!(config.parameters && (
    config.parameters.path ||
    config.parameters.query ||
    config.parameters.body ||
    config.parameters.headers
  ));
}

// Utility type for SQL parameter values
export type SqlParameterValue = string | number | boolean | null;
export type SqlParameters = Record<string, SqlParameterValue>;
/**
 * Manual route registration file - inspired by Vue Router pattern
 * Instead of components, we import and register JSON route configurations
 */

import type { RouteRegistration, AppMetadata, RouteConfig } from '../types/route.types.js';
import { toTitleCase } from '../utils/stringHelpers.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper to load JSON configs at runtime without path aliases
function loadJson(relativePath: string): RouteConfig {
  const abs = resolve(__dirname, '../../assets/apps', relativePath);
  return JSON.parse(readFileSync(abs, 'utf-8'));
}

// Authentication routes
const loginConfig = loadJson('auth/login.json');

// System Services routes
const getServicesConfig = loadJson('system-services/get-services.json');
const getJobsConfig = loadJson('system-services/get-jobs.json');
const getLibrariesConfig = loadJson('system-services/get-libraries.json');

// Sample routes
const getSystemValuesConfig = loadJson('sample/get-system-values.json');
const enhancedSystemInfoConfig = loadJson('sample/enhanced-system-info.json');

// User Management routes
const getUserConfig = loadJson('user-management/get-user.json');
const getUsersConfig = loadJson('user-management/get-users.json');
const createUserConfig = loadJson('user-management/create-user.json');
const updateUserConfig = loadJson('user-management/update-user.json');
const deleteUserConfig = loadJson('user-management/delete-user.json');
const getRolesConfig = loadJson('user-management/get-roles.json');
const createRoleConfig = loadJson('user-management/create-role.json');
const assignRoleConfig = loadJson('user-management/assign-role.json');
const removeRoleConfig = loadJson('user-management/remove-role.json');
const getPermissionsConfig = loadJson('user-management/get-permissions.json');
const createPermissionConfig = loadJson('user-management/create-permission.json');
const checkPermissionConfig = loadJson('user-management/check-permission.json');

/**
 * App metadata definitions with proper Title Case display names
 */
const apps: Record<string, AppMetadata> = {
  auth: {
    name: 'auth',
    displayName: 'Authentication',
    description: 'Authentication and authorization endpoints',
    version: '1.0.0',
    tags: ['Authentication', 'Security']
  },
  'system-services': {
    name: 'system-services',
    displayName: 'System Services',
    description: 'IBM i system services and monitoring',
    version: '1.0.0',
    tags: ['System', 'IBM i', 'Monitoring']
  },
  sample: {
    name: 'sample',
    displayName: 'Sample',
    description: 'Sample and demo endpoints',
    version: '1.0.0',
    tags: ['Sample', 'Demo']
  },
  'user-management': {
    name: 'user-management',
    displayName: 'User Management',
    description: 'User, role, and permission management',
    version: '1.0.0',
    tags: ['Users', 'Roles', 'Permissions', 'Security']
  }
};

/**
 * Helper function to create a route registration
 */
function createRoute(
  path: string,
  method: RouteConfig['method'],
  config: RouteConfig,
  appName: string
): RouteRegistration {
  // Ensure the config has the app metadata
  const enhancedConfig = {
    ...config,
    app: appName,
    method,
    path,
    tags: config.tags || apps[appName]?.tags || [toTitleCase(appName)]
  };

  return {
    path,
    method,
    config: enhancedConfig,
    app: apps[appName]
  };
}

/**
 * Manually registered routes
 * Each route is explicitly imported and registered for better control
 */
export const routes: RouteRegistration[] = [
  // ===== Authentication Routes =====
  createRoute('/auth/login', 'POST', loginConfig as RouteConfig, 'auth'),

  // ===== System Services Routes =====
  createRoute('/system/services', 'GET', getServicesConfig as RouteConfig, 'system-services'),
  createRoute('/system/jobs', 'GET', getJobsConfig as RouteConfig, 'system-services'),
  createRoute('/system/libraries', 'GET', getLibrariesConfig as RouteConfig, 'system-services'),

  // ===== Sample Routes =====
  createRoute('/sample/system-values', 'GET', getSystemValuesConfig as RouteConfig, 'sample'),
  createRoute('/sample/system-info', 'GET', enhancedSystemInfoConfig as RouteConfig, 'sample'),

  // ===== User Management Routes =====
  // User CRUD operations
  createRoute('/users', 'GET', getUsersConfig as RouteConfig, 'user-management'),
  createRoute('/users/:id', 'GET', getUserConfig as RouteConfig, 'user-management'),
  createRoute('/users', 'POST', createUserConfig as RouteConfig, 'user-management'),
  createRoute('/users/:id', 'PUT', updateUserConfig as RouteConfig, 'user-management'),
  createRoute('/users/:id', 'DELETE', deleteUserConfig as RouteConfig, 'user-management'),

  // Role management
  createRoute('/roles', 'GET', getRolesConfig as RouteConfig, 'user-management'),
  createRoute('/roles', 'POST', createRoleConfig as RouteConfig, 'user-management'),
  createRoute('/users/:userId/roles', 'POST', assignRoleConfig as RouteConfig, 'user-management'),
  createRoute('/users/:userId/roles/:roleId', 'DELETE', removeRoleConfig as RouteConfig, 'user-management'),

  // Permission management
  createRoute('/permissions', 'GET', getPermissionsConfig as RouteConfig, 'user-management'),
  createRoute('/permissions', 'POST', createPermissionConfig as RouteConfig, 'user-management'),
  createRoute('/users/:userId/permissions/check', 'POST', checkPermissionConfig as RouteConfig, 'user-management'),
];

/**
 * Get all registered routes
 */
export function getAllRoutes(): RouteRegistration[] {
  return routes;
}

/**
 * Get routes for a specific app
 */
export function getAppRoutes(appName: string): RouteRegistration[] {
  return routes.filter(route => route.app.name === appName);
}

/**
 * Get all available apps
 */
export function getAvailableApps(): AppMetadata[] {
  return Object.values(apps);
}

/**
 * Get app metadata by name
 */
export function getAppMetadata(appName: string): AppMetadata | undefined {
  return apps[appName];
}

/**
 * Find a route by method and path
 */
export function findRoute(method: string, path: string): RouteRegistration | undefined {
  return routes.find(route => 
    route.method === method.toUpperCase() && 
    route.path === path
  );
}

/**
 * Get routes grouped by app
 */
export function getRoutesGroupedByApp(): Record<string, RouteRegistration[]> {
  const grouped: Record<string, RouteRegistration[]> = {};
  
  for (const route of routes) {
    const appName = route.app.name;
    if (!grouped[appName]) {
      grouped[appName] = [];
    }
    grouped[appName].push(route);
  }
  
  return grouped;
}

/**
 * Get route statistics
 */
export function getRouteStatistics(): {
  total: number;
  byMethod: Record<string, number>;
  byApp: Record<string, number>;
} {
  const stats = {
    total: routes.length,
    byMethod: {} as Record<string, number>,
    byApp: {} as Record<string, number>
  };
  
  for (const route of routes) {
    // Count by method
    stats.byMethod[route.method] = (stats.byMethod[route.method] || 0) + 1;
    
    // Count by app
    stats.byApp[route.app.name] = (stats.byApp[route.app.name] || 0) + 1;
  }
  
  return stats;
}

// Export for use in other modules
export default {
  routes,
  apps,
  getAllRoutes,
  getAppRoutes,
  getAvailableApps,
  getAppMetadata,
  findRoute,
  getRoutesGroupedByApp,
  getRouteStatistics
};

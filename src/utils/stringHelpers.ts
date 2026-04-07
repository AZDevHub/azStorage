/**
 * String manipulation utilities
 */

/**
 * Convert a string to Title Case
 * Handles hyphenated strings properly
 * Examples:
 *   'user-management' -> 'User Management'
 *   'system-services' -> 'System Services'
 *   'auth' -> 'Auth'
 *   'IBM-i-services' -> 'IBM I Services'
 */
export function toTitleCase(str: string): string {
  if (!str) return '';
  
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Convert a string to kebab-case
 * Examples:
 *   'User Management' -> 'user-management'
 *   'System Services' -> 'system-services'
 */
export function toKebabCase(str: string): string {
  if (!str) return '';
  
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Convert a string to camelCase
 * Examples:
 *   'user-management' -> 'userManagement'
 *   'system-services' -> 'systemServices'
 */
export function toCamelCase(str: string): string {
  if (!str) return '';
  
  const parts = str.split(/[-_\s]+/);
  return parts[0].toLowerCase() + 
    parts.slice(1).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
}

/**
 * Convert a string to PascalCase
 * Examples:
 *   'user-management' -> 'UserManagement'
 *   'system-services' -> 'SystemServices'
 */
export function toPascalCase(str: string): string {
  if (!str) return '';
  
  return str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Convert a string to SNAKE_CASE
 * Examples:
 *   'user-management' -> 'USER_MANAGEMENT'
 *   'System Services' -> 'SYSTEM_SERVICES'
 */
export function toSnakeCase(str: string, uppercase = true): string {
  if (!str) return '';
  
  const snake = str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_');
  
  return uppercase ? snake.toUpperCase() : snake.toLowerCase();
}

/**
 * Truncate a string to a maximum length with ellipsis
 */
export function truncate(str: string, maxLength: number, suffix = '...'): string {
  if (!str || str.length <= maxLength) return str;
  
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Slugify a string for URLs
 * Examples:
 *   'User Management API' -> 'user-management-api'
 *   'IBM i Services' -> 'ibm-i-services'
 */
export function slugify(str: string): string {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Escape special characters for use in SQL LIKE queries
 */
export function escapeSqlLike(str: string): string {
  if (!str) return '';
  
  return str
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return str.replace(/[&<>"']/g, char => htmlEscapes[char]);
}

/**
 * Generate a random string
 */
export function randomString(length: number, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

/**
 * Pad a string to a certain length
 */
export function padString(str: string, length: number, padChar = ' ', padLeft = false): string {
  if (str.length >= length) return str;
  
  const padding = padChar.repeat(length - str.length);
  return padLeft ? padding + str : str + padding;
}

/**
 * Check if a string is a valid JSON
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse a template string with variable replacements
 * Example: parseTemplate('Hello {{name}}', { name: 'World' }) -> 'Hello World'
 */
export function parseTemplate(template: string, variables: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables.hasOwnProperty(key) ? String(variables[key]) : match;
  });
}
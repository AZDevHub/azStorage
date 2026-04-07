# Integration Patterns from Java FetchAPI

## Overview
Analysis of patterns from the Java FetchAPI project that can enhance the Node.js dynamic REST API server.

## Key Patterns to Adopt

### 1. SQL Substitution Engine Pattern
**Java Implementation**: `SqlSubstitutionEngine.java`
- Uses `{{variableName}}` syntax (same as our Node.js implementation ✅)
- Distinguishes between identifiers and values
- Whitelists safe identifiers for direct substitution
- Converts value placeholders to parameterized queries

**Node.js Enhancement**:
```javascript
// Add to SqlParameterReplacer.js
class EnhancedSqlParameterReplacer {
  static ALLOWED_IDENTIFIERS = new Set([
    'QSYS2', 'CISTOOLS', 'SQL_SERVICES', 
    'SERVICES_INFO', 'SYSCOLUMNS', 'SYSTABLES'
  ]);
  
  static IDENTIFIER_CONTEXT = /(?:FROM|JOIN|INTO|UPDATE)\s+\{\{[^}]+\}\}/i;
  
  static isIdentifier(sql, placeholder) {
    // Check if placeholder is used as table/column name
    return this.IDENTIFIER_CONTEXT.test(sql) || 
           this.ALLOWED_IDENTIFIERS.has(placeholder);
  }
}
```

### 2. Response Formatter Factory Pattern
**Java Implementation**: Multiple formatter classes (JSON, XML, CSV, Excel, HTML)
- Factory pattern for format selection
- Consistent interface across formats
- Error-specific formatting

**Node.js Enhancement**:
```javascript
// Create src/formatters/FormatterFactory.js
class FormatterFactory {
  static formatters = {
    'json': JsonFormatter,
    'xml': XmlFormatter,
    'csv': CsvFormatter,
    'excel': ExcelFormatter,
    'html': HtmlFormatter
  };
  
  static getFormatter(format) {
    return this.formatters[format] || JsonFormatter;
  }
}

// In route config:
{
  "response": {
    "format": "csv",  // or "json", "xml", etc.
    "headers": true,
    "delimiter": ","
  }
}
```

### 3. Function Registry Pattern
**Java Implementation**: `FunctionRegistry.java` + `FunctionDefinition.java`
- Central registry of available functions
- Function metadata and validation
- Dynamic function discovery

**Node.js Enhancement**:
```javascript
// Create src/services/FunctionRegistry.js
class FunctionRegistry {
  constructor() {
    this.functions = new Map();
    this.loadFunctions();
  }
  
  register(name, definition) {
    this.functions.set(name, {
      ...definition,
      validate: this.createValidator(definition.parameters),
      execute: this.createExecutor(definition)
    });
  }
  
  async execute(functionName, params) {
    const func = this.functions.get(functionName);
    if (!func) throw new Error(`Function ${functionName} not found`);
    
    await func.validate(params);
    return func.execute(params);
  }
}
```

### 4. Service Registry Pattern
**Java Implementation**: `ServiceRegistry.java`
- Singleton pattern for service management
- Lazy initialization
- Service lifecycle management

**Node.js Implementation**:
```javascript
// Create src/services/ServiceRegistry.js
class ServiceRegistry {
  static instance = null;
  
  constructor() {
    if (ServiceRegistry.instance) {
      return ServiceRegistry.instance;
    }
    
    this.services = new Map();
    ServiceRegistry.instance = this;
  }
  
  register(name, service) {
    this.services.set(name, service);
  }
  
  get(name) {
    return this.services.get(name);
  }
  
  async initialize() {
    // Initialize all services
    for (const [name, service] of this.services) {
      if (service.initialize) {
        await service.initialize();
      }
    }
  }
}
```

### 5. Authentication Manager Pattern
**Java Implementation**: `AuthenticationManager.java`
- Token-based authentication
- Session management
- Role-based access control

**Node.js Enhancement**:
```javascript
// Create src/middleware/AuthenticationMiddleware.js
class AuthenticationMiddleware {
  static async authenticate(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
      const user = await AuthService.verifyToken(token);
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
  
  static requireRole(role) {
    return (req, res, next) => {
      if (!req.user?.roles?.includes(role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    };
  }
}

// In route config:
{
  "authentication": {
    "required": true,
    "roles": ["admin", "user"]
  }
}
```

### 6. OpenAPI Generator Pattern
**Java Implementation**: `OpenApiGenerator.java`
- Automatic OpenAPI spec generation
- Introspection of available endpoints
- Schema validation

**Node.js Enhancement**:
```javascript
// Create src/utils/OpenApiGenerator.js
class OpenApiGenerator {
  static generate(routes) {
    return {
      openapi: '3.0.0',
      info: {
        title: 'Dynamic REST API',
        version: '1.0.0'
      },
      paths: this.generatePaths(routes),
      components: {
        schemas: this.generateSchemas(routes),
        securitySchemes: this.generateSecuritySchemes()
      }
    };
  }
  
  static generatePaths(routes) {
    const paths = {};
    for (const route of routes) {
      if (!paths[route.path]) {
        paths[route.path] = {};
      }
      paths[route.path][route.method.toLowerCase()] = {
        summary: route.description,
        parameters: this.generateParameters(route.parameters),
        responses: this.generateResponses(route.response)
      };
    }
    return paths;
  }
}
```

## IBM i Specific Patterns

### QSYS2.SERVICES_INFO Integration
**Java Pattern**: Dynamic service discovery from IBM i
```sql
SELECT * FROM QSYS2.SERVICES_INFO 
WHERE SERVICE_NAME = '{{serviceName}}'
```

**Node.js Implementation**:
```javascript
// Create src/services/IBMiServiceDiscovery.js
class IBMiServiceDiscovery {
  async discoverServices() {
    const sql = `
      SELECT SERVICE_NAME, SERVICE_SCHEMA, SERVICE_PROGRAM,
             PARAMETER_STYLE, EXTERNAL_NAME
      FROM QSYS2.SERVICES_INFO
      WHERE ENABLED = 'Y'
    `;
    
    const services = await this.db.query(sql);
    return this.generateRouteConfigs(services);
  }
  
  generateRouteConfigs(services) {
    return services.map(service => ({
      path: `/ibmi/${service.SERVICE_NAME.toLowerCase()}`,
      method: 'POST',
      sql: `CALL ${service.SERVICE_SCHEMA}.${service.SERVICE_PROGRAM}({{params}})`,
      description: `IBM i service: ${service.SERVICE_NAME}`
    }));
  }
}
```

## Performance Optimizations from Java

### 1. Connection Pooling Strategy
```javascript
// Match Java's pool configuration
const poolConfig = {
  min: 5,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  acquireTimeoutMillis: 10000
};
```

### 2. Query Result Caching
```javascript
class QueryCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 300000; // 5 minutes
  }
  
  getCacheKey(sql, params) {
    return `${sql}:${JSON.stringify(params)}`;
  }
  
  get(sql, params) {
    const key = this.getCacheKey(sql, params);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }
    
    return null;
  }
}
```

### 3. Batch Processing
```javascript
// Support batch operations like Java implementation
class BatchProcessor {
  async executeBatch(operations) {
    const results = [];
    const connection = await this.db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      for (const op of operations) {
        const result = await this.executeOperation(connection, op);
        results.push(result);
      }
      
      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
```

## Security Patterns

### 1. Input Validation
```javascript
// Port Java's validation patterns
class InputValidator {
  static validators = {
    alphanumeric: /^[a-zA-Z0-9]+$/,
    identifier: /^[a-zA-Z][a-zA-Z0-9_]*$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    date: /^\d{4}-\d{2}-\d{2}$/
  };
  
  static validate(value, type) {
    const validator = this.validators[type];
    if (!validator) return true;
    return validator.test(value);
  }
}
```

### 2. Rate Limiting
```javascript
// Implement per-endpoint rate limiting
const rateLimit = require('express-rate-limit');

class RateLimitManager {
  static createLimiter(config) {
    return rateLimit({
      windowMs: config.windowMs || 15 * 60 * 1000,
      max: config.max || 100,
      message: 'Too many requests',
      standardHeaders: true,
      legacyHeaders: false
    });
  }
}
```

## Migration Path

### Phase 1: Core Enhancements
1. Implement formatter factory pattern
2. Add authentication middleware
3. Enhance SQL parameter replacer with identifier validation

### Phase 2: Advanced Features
1. Add service registry pattern
2. Implement OpenAPI generation
3. Add query result caching

### Phase 3: IBM i Integration
1. Implement QSYS2.SERVICES_INFO discovery
2. Add JT400-compatible patterns
3. Enable stored procedure calls

### Phase 4: Production Readiness
1. Add comprehensive logging
2. Implement monitoring endpoints
3. Add batch processing support
4. Enable hot-reload of configurations

## Configuration Compatibility

### Java FetchAPI Config Format
```properties
# Java properties file
db.url=jdbc:as400://system
db.user=username
db.password=password
function.timeout=30000
```

### Node.js Equivalent
```javascript
// .env file
DB_CONNECTION_STRING=Driver={IBM i Access ODBC Driver};System=system;UID=username;PWD=password
FUNCTION_TIMEOUT=30000
```

## Testing Strategy Alignment

### Java Test Patterns
- Unit tests for each formatter
- Integration tests for SQL substitution
- E2E tests for complete request flow

### Node.js Test Implementation
```javascript
// Match Java's testing approach
describe('SqlParameterReplacer', () => {
  it('should replace value parameters with placeholders', () => {
    const sql = "SELECT * FROM table WHERE id = '{{id}}'";
    const params = { id: '123' };
    const result = replacer.replace(sql, params);
    expect(result.sql).toBe("SELECT * FROM table WHERE id = ?");
    expect(result.values).toEqual(['123']);
  });
  
  it('should validate identifiers against whitelist', () => {
    const sql = "SELECT * FROM {{table}}";
    const params = { table: 'QSYS2.SERVICES_INFO' };
    expect(() => replacer.replace(sql, params)).not.toThrow();
  });
});
```

## Summary

The Java FetchAPI provides excellent patterns for:
1. **Security**: SQL injection prevention, input validation
2. **Flexibility**: Multiple output formats, dynamic service discovery
3. **Performance**: Connection pooling, caching, batch processing
4. **Enterprise**: Authentication, authorization, audit logging
5. **IBM i**: Native support for AS/400 services and DB2

These patterns can be incrementally adopted to enhance the Node.js dynamic REST API server while maintaining its clean, config-driven architecture.
# Dynamic REST API Server - Context Management

## Project Summary
A clean, config-driven dynamic REST API server transformed from Vue.js frontend to Node.js backend, using JSON configurations to generate API endpoints without code changes.

## Architecture Decisions

### Core Design Principles
1. **Config-Driven**: All API endpoints defined via JSON configuration files
2. **Clean Separation**: Services, utilities, and routes clearly separated
3. **Dynamic Loading**: Routes automatically discovered and registered at startup
4. **Template-Based SQL**: Using `{{parameter}}` syntax for SQL parameter replacement
5. **ODBC Connectivity**: Database-agnostic connection via ODBC drivers

### Key Technical Choices
- **Framework**: Express.js (lightweight, widely supported)
- **Database**: ODBC (supports SQL Server, DB2, Oracle, etc.)
- **Module System**: ES6 modules (`"type": "module"`)
- **Configuration Format**: JSON (simple, declarative, no code execution)
- **Parameter Syntax**: `{{param}}` (clear distinction from SQL placeholders)

## Current Implementation Status

### ✅ Completed Components
| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| DynamicApiServer | `src/server.js` | Main Express server with dynamic route registration | ✅ Complete |
| RouteLoader | `src/utils/RouteLoader.js` | Loads JSON configs from assets/apps/ | ✅ Complete |
| SqlParameterReplacer | `src/utils/SqlParameterReplacer.js` | Handles {{parameter}} replacement | ✅ Complete |
| DatabaseService | `src/services/DatabaseService.js` | ODBC connection pool and queries | ✅ Complete |
| ApiService | `src/services/ApiService.js` | Route execution orchestration | ✅ Complete |

### 📁 Route Configurations Created
- `assets/apps/items/get-items.json` - List items with filtering
- `assets/apps/items/get-item-by-id.json` - Get specific item by ID
- `assets/apps/categories/get-categories.json` - List all categories
- `assets/apps/auth/login.json` - User authentication endpoint

## Integration Points

### Database Connection
```javascript
connectionString: process.env.DB_CONNECTION_STRING || 'Driver={SQL Server};...'
```
- Supports multiple database systems via ODBC
- Connection pooling for performance
- Health check endpoint validates connectivity

### Parameter Flow
```
Request → Path/Query/Body Params → Parameter Mapping → SQL Template → Query Execution → Response
```

### Configuration Schema
```json
{
  "path": "/resource/:id",
  "method": "GET|POST|PUT|DELETE",
  "parameters": { /* validation rules */ },
  "sql": "SELECT ... FROM {{table}} WHERE ...",
  "parameterMappings": { /* param source mapping */ },
  "response": { /* response format */ }
}
```

## Active Work Streams

### Immediate Next Steps
1. **Testing Infrastructure**
   - Unit tests for SqlParameterReplacer
   - Integration tests for route loading
   - E2E tests for complete request flow

2. **Configuration Enhancements**
   - Hot-reload capability for route configs
   - Schema validation for JSON configs
   - Config inheritance/composition

3. **Security Hardening**
   - Input sanitization middleware
   - Rate limiting per endpoint
   - Authentication/authorization layer

### Future Enhancements
- **Performance**: Response caching, query optimization
- **Monitoring**: Request logging, metrics collection
- **Documentation**: Auto-generate OpenAPI specs from configs
- **DevEx**: CLI for generating route configs

## Known Issues & TODOs

### Critical
- [ ] Add proper error handling for malformed JSON configs
- [ ] Implement SQL injection prevention beyond parameter validation
- [ ] Add connection retry logic for database failures

### Important
- [ ] Document environment variable configuration
- [ ] Create example .env file
- [ ] Add request/response logging middleware
- [ ] Implement graceful shutdown handling

### Nice to Have
- [ ] WebSocket support for real-time endpoints
- [ ] GraphQL layer on top of REST endpoints
- [ ] Admin UI for managing route configurations

## Pattern Library

### SQL Template Patterns
```sql
-- List with pagination
SELECT * FROM {{table}} 
ORDER BY {{orderBy}} 
OFFSET {{offset}} ROWS 
FETCH NEXT {{limit}} ROWS ONLY

-- Conditional filtering
SELECT * FROM {{table}} 
WHERE 1=1 
  AND ('{{filter}}' = '' OR name LIKE '%{{filter}}%')
  AND ('{{status}}' = 'all' OR status = '{{status}}')

-- Dynamic columns
SELECT {{columns}} FROM {{table}} WHERE id = '{{id}}'
```

### Route Configuration Patterns
```json
// CRUD operations
GET    /resource      → list
GET    /resource/:id  → get one
POST   /resource      → create
PUT    /resource/:id  → update
DELETE /resource/:id  → delete

// Batch operations
POST   /resource/batch → batch create/update
DELETE /resource/batch → batch delete

// Special operations
POST   /resource/:id/action → perform action
GET    /resource/search     → advanced search
```

## Performance Benchmarks
- Route loading time: < 100ms for 100 routes
- Database connection pool: 10-20 connections
- Response time target: < 200ms for simple queries
- Throughput target: 1000 req/sec per instance

## Context for Next Session

### Quick Context (for immediate work)
- Dynamic REST API server using JSON configs
- ODBC database connectivity implemented
- Route loading and SQL templating complete
- Need: testing, security hardening, documentation

### Key Files to Review
1. `src/server.js` - Main server setup
2. `src/utils/SqlParameterReplacer.js` - Core templating logic
3. `assets/apps/*/**.json` - Route configurations
4. `CLAUDE.md` - Full documentation

### Integration with Existing Codebase
- Similar pattern exists in Java FetchAPI project
- Can leverage patterns from ObjectAPI (JAX-RS)
- IBM i integration possible via ODBC to DB2

## Agent Coordination Notes

### For tech-lead-orchestrator
- Project follows clean architecture principles
- Ready for performance optimization phase
- Security review needed before production

### For api-architect
- OpenAPI spec generation possible from JSON configs
- Consider API versioning strategy
- Rate limiting configuration needed

### For performance-engineer
- Connection pooling implemented but needs tuning
- Consider caching layer for frequent queries
- Database query optimization opportunities

### For ai-engineer
- Token-efficient config format already in place
- Opportunity for AI-generated route configs
- Could add natural language to SQL translation

---
*Last Updated: 2025-09-08*
*Context Version: 1.0*
*Next Review: After testing implementation*
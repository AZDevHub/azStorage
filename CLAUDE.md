# Dynamic REST API Server for IBM i

## Overview

This is a config-driven dynamic REST API server specifically designed for IBM i systems. It generates API endpoints from JSON configuration files, uses ODBC for DB2 for i connectivity, and supports dynamic SQL parameter replacement using a templating system. The server can expose IBM i system information, services, and custom business data through modern REST APIs.

## Architecture

### Core Components

1. **RouteLoader** (`src/utils/RouteLoader.js`)
   - Scans `assets/apps/` directories for JSON route configuration files
   - Loads and parses route definitions dynamically
   - Supports hot-reloading of route configurations

2. **SqlParameterReplacer** (`src/utils/SqlParameterReplacer.js`)
   - Handles dynamic SQL parameter replacement using `{{parameter}}` syntax
   - Maps request data (path params, query params, body) to SQL parameters
   - Supports configuration-based parameter mapping (e.g., table names)

3. **DatabaseService** (`src/services/DatabaseService.js`)
   - ODBC connection pool management
   - SQL query execution with error handling
   - Database health checks

4. **ApiService** (`src/services/ApiService.js`)
   - Orchestrates route execution
   - Parameter validation and default value application
   - Response formatting based on route configuration

5. **DynamicApiServer** (`src/server.js`)
   - Express.js server setup
   - Dynamic route registration from config files
   - Middleware configuration (CORS, body parsing, logging)

### Directory Structure

```
src/
├── server.js              # Main server entry point
├── services/
│   ├── DatabaseService.js  # ODBC database operations
│   └── ApiService.js       # API logic orchestration
└── utils/
    ├── RouteLoader.js      # Dynamic route loading
    └── SqlParameterReplacer.js # SQL parameter templating

assets/
└── apps/                   # Route configuration directories
    ├── items/             # Items-related endpoints
    ├── categories/        # Categories-related endpoints
    ├── auth/              # Authentication endpoints
    └── files/             # File-related endpoints
```

## Route Configuration Format

Each API endpoint is defined in a separate JSON file with the following structure:

```json
{
  "path": "/items/:id",
  "method": "GET",
  "description": "Get a specific item by ID",
  "parameters": {
    "path": {
      "id": {
        "type": "string",
        "description": "Item ID",
        "required": true
      }
    },
    "query": {
      "include_details": {
        "type": "boolean",
        "description": "Include detailed information",
        "default": false
      }
    }
  },
  "sql": "SELECT item_id, item_name, category FROM {{itemTable}} WHERE item_id = '{{id}}' AND ('{{include_details}}' = 'true' OR description IS NOT NULL)",
  "parameterMappings": {
    "id": "path.id",
    "include_details": "query.include_details",
    "itemTable": "config.tables.items"
  },
  "response": {
    "type": "object",
    "contentType": "application/json"
  }
}
```

### Parameter Types

- **Path Parameters**: `:id` in the URL path
- **Query Parameters**: URL query string parameters
- **Body Parameters**: JSON request body fields
- **Config Parameters**: Server configuration values (table names, etc.)

### SQL Parameter Replacement

The system uses `{{parameter}}` syntax in SQL queries, which gets replaced before execution:

- `{{id}}` → replaced with path parameter value
- `{{itemTable}}` → replaced with configured table name
- `{{include_details}}` → replaced with query parameter value

Since ODBC parameter markers (`?`) can only be used in WHERE clauses, we use string replacement for dynamic table names and column selections.

## Configuration

Server configuration is handled in `src/server.js` with IBM i-specific settings:

```javascript
this.config = {
  database: {
    connectionString: process.env.DB_CONNECTION_STRING || 'Driver={iSeries Access ODBC Driver};System=your_ibmi_system;Uid=your_user;Pwd=your_password;'
  },
  tables: {
    items: process.env.ITEMS_TABLE || 'MYLIB.ITEMS',
    categories: process.env.CATEGORIES_TABLE || 'MYLIB.CATEGORIES',
    users: process.env.USERS_TABLE || 'MYLIB.USERS'
  },
  ibmi: {
    system: process.env.IBMI_SYSTEM || 'your_ibmi_system',
    library: process.env.IBMI_LIBRARY || 'MYLIB',
    naming: process.env.IBMI_NAMING || 'sql' // 'sql' or 'system'
  }
};
```

### IBM i ODBC Connection Options

See `.env.example` for various connection string formats:
- **iSeries Access ODBC Driver**: `Driver={iSeries Access ODBC Driver};System=...;`
- **IBM i Access ODBC Driver**: `Driver={IBM i Access ODBC Driver};System=...;`
- **DSN**: `DSN=your_dsn_name;Uid=...;Pwd=...;`

Additional connection parameters:
- `DefaultLibraries=LIB1,LIB2,LIB3` - Set library list
- `Naming=0` - SQL naming (0) vs System naming (1)
- `CommitMode=2` - Transaction isolation level
- `ExtendedDynamic=1` - Enable extended dynamic SQL

## Usage

### Starting the Server

```bash
npm install
npm start
```

### Development Mode

```bash
npm run dev  # Uses Node.js --watch for auto-restart
```

### API Endpoints

- `GET /health` - Server and database health check
- `GET /routes` - List all available dynamic routes
- Dynamic routes based on JSON configurations in `assets/apps/`

### Adding New Endpoints

1. Create a JSON configuration file in the appropriate `assets/apps/` subdirectory
2. Define the route path, method, parameters, SQL query, and parameter mappings
3. Restart the server (or implement hot-reloading)
4. The endpoint will be automatically available

## Example Routes

### Business Data
- `GET /items` - List items with optional filtering
- `GET /items/:id` - Get specific item
- `GET /categories` - List categories
- `POST /auth/login` - User authentication

### IBM i System Information
- `GET /system/services` - Get IBM i services from QSYS2.SERVICES_INFO
- `GET /system/jobs` - Get active jobs information
- `GET /system/libraries` - Get libraries information

### DB2 for i Specific Features
All routes use DB2 for i SQL syntax:
- `FETCH FIRST n ROWS ONLY` instead of `LIMIT`
- `OFFSET n ROWS` for pagination
- IBM i system services and table functions
- Library.table naming convention

## Security Considerations

- SQL injection prevention through parameter validation
- CORS configuration
- Request size limits
- Parameter type validation
- Required parameter enforcement

## Environment Variables

### Database Connection
- `DB_CONNECTION_STRING` - IBM i ODBC connection string
- `IBMI_SYSTEM` - IBM i system name/IP
- `IBMI_LIBRARY` - Default library for objects
- `IBMI_NAMING` - Naming convention ('sql' or 'system')

### Server Configuration  
- `PORT` - Server port (default: 3000)
- `CORS_ORIGIN` - CORS allowed origins

### Table Mappings
- `ITEMS_TABLE` - Items table (e.g., 'MYLIB.ITEMS')
- `CATEGORIES_TABLE` - Categories table (e.g., 'MYLIB.CATEGORIES') 
- `USERS_TABLE` - Users table (e.g., 'MYLIB.USERS')

## Dependencies

- **express**: Web server framework
- **cors**: Cross-origin resource sharing
- **odbc**: Database connectivity

This architecture provides a clean separation of concerns, making it easy to add new API endpoints without writing code - just add JSON configuration files.
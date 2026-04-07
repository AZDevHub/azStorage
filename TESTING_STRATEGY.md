# Testing Strategy for Dynamic REST API Server

## Overview
Comprehensive testing approach for the config-driven dynamic REST API server, covering unit, integration, and end-to-end testing.

## Testing Framework Stack

### Recommended Tools
- **Test Runner**: Jest (built-in mocking, coverage, watch mode)
- **HTTP Testing**: Supertest (Express app testing)
- **Database Mocking**: jest-odbc-mock or manual mocks
- **Code Coverage**: Jest built-in with Istanbul
- **E2E Testing**: Playwright or Cypress for API testing
- **Load Testing**: Artillery or K6

## Test Structure

```
test/
├── unit/
│   ├── utils/
│   │   ├── SqlParameterReplacer.test.js
│   │   └── RouteLoader.test.js
│   ├── services/
│   │   ├── DatabaseService.test.js
│   │   └── ApiService.test.js
│   └── formatters/
│       └── FormatterFactory.test.js
├── integration/
│   ├── routes/
│   │   ├── items.test.js
│   │   ├── categories.test.js
│   │   └── auth.test.js
│   └── database/
│       └── connection.test.js
├── e2e/
│   ├── api-workflow.test.js
│   └── performance.test.js
├── fixtures/
│   ├── routes/
│   │   └── test-route.json
│   └── data/
│       └── test-data.sql
└── mocks/
    ├── database.js
    └── services.js
```

## Unit Testing

### SqlParameterReplacer Tests

```javascript
// test/unit/utils/SqlParameterReplacer.test.js
import { describe, it, expect } from '@jest/globals';
import SqlParameterReplacer from '../../../src/utils/SqlParameterReplacer.js';

describe('SqlParameterReplacer', () => {
  describe('replace()', () => {
    it('should replace simple parameters', () => {
      const sql = "SELECT * FROM items WHERE id = '{{id}}'";
      const params = { id: '123' };
      const result = SqlParameterReplacer.replace(sql, params);
      
      expect(result).toBe("SELECT * FROM items WHERE id = '123'");
    });
    
    it('should handle multiple parameters', () => {
      const sql = "SELECT * FROM {{table}} WHERE id = '{{id}}' AND status = '{{status}}'";
      const params = { table: 'items', id: '123', status: 'active' };
      const result = SqlParameterReplacer.replace(sql, params);
      
      expect(result).toBe("SELECT * FROM items WHERE id = '123' AND status = 'active'");
    });
    
    it('should throw error for missing required parameters', () => {
      const sql = "SELECT * FROM items WHERE id = '{{id}}'";
      const params = {};
      
      expect(() => SqlParameterReplacer.replace(sql, params))
        .toThrow('Missing required parameter: id');
    });
    
    it('should escape single quotes to prevent SQL injection', () => {
      const sql = "SELECT * FROM items WHERE name = '{{name}}'";
      const params = { name: "O'Reilly" };
      const result = SqlParameterReplacer.replace(sql, params);
      
      expect(result).toBe("SELECT * FROM items WHERE name = 'O''Reilly'");
    });
    
    it('should validate table name parameters', () => {
      const sql = "SELECT * FROM {{table}}";
      const params = { table: 'items; DROP TABLE users--' };
      
      expect(() => SqlParameterReplacer.replace(sql, params))
        .toThrow('Invalid table name');
    });
  });
});
```

### RouteLoader Tests

```javascript
// test/unit/utils/RouteLoader.test.js
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import RouteLoader from '../../../src/utils/RouteLoader.js';
import fs from 'fs/promises';

jest.mock('fs/promises');

describe('RouteLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('loadRoutes()', () => {
    it('should load all JSON route configurations', async () => {
      const mockRouteConfig = {
        path: '/test',
        method: 'GET',
        sql: 'SELECT * FROM test'
      };
      
      fs.readdir.mockResolvedValue(['test-route.json']);
      fs.readFile.mockResolvedValue(JSON.stringify(mockRouteConfig));
      fs.stat.mockResolvedValue({ isDirectory: () => true });
      
      const routes = await RouteLoader.loadRoutes('assets/apps');
      
      expect(routes).toHaveLength(1);
      expect(routes[0]).toMatchObject(mockRouteConfig);
    });
    
    it('should validate route configuration schema', async () => {
      const invalidConfig = {
        // Missing required 'path' field
        method: 'GET'
      };
      
      fs.readdir.mockResolvedValue(['invalid.json']);
      fs.readFile.mockResolvedValue(JSON.stringify(invalidConfig));
      
      await expect(RouteLoader.loadRoutes('assets/apps'))
        .rejects.toThrow('Invalid route configuration');
    });
    
    it('should skip non-JSON files', async () => {
      fs.readdir.mockResolvedValue(['README.md', 'route.json']);
      fs.readFile.mockResolvedValue('{"path": "/test", "method": "GET"}');
      
      const routes = await RouteLoader.loadRoutes('assets/apps');
      
      expect(routes).toHaveLength(1);
      expect(fs.readFile).toHaveBeenCalledTimes(1);
    });
  });
});
```

### DatabaseService Tests

```javascript
// test/unit/services/DatabaseService.test.js
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import DatabaseService from '../../../src/services/DatabaseService.js';

// Mock ODBC module
jest.mock('odbc', () => ({
  pool: jest.fn(() => ({
    connect: jest.fn(),
    query: jest.fn(),
    close: jest.fn()
  }))
}));

describe('DatabaseService', () => {
  let dbService;
  
  beforeEach(() => {
    dbService = new DatabaseService('mock-connection-string');
  });
  
  describe('query()', () => {
    it('should execute query and return results', async () => {
      const mockResults = [{ id: 1, name: 'Test' }];
      dbService.pool.query.mockResolvedValue(mockResults);
      
      const result = await dbService.query('SELECT * FROM test');
      
      expect(result).toEqual(mockResults);
      expect(dbService.pool.query).toHaveBeenCalledWith('SELECT * FROM test');
    });
    
    it('should handle query errors', async () => {
      dbService.pool.query.mockRejectedValue(new Error('Database error'));
      
      await expect(dbService.query('SELECT * FROM test'))
        .rejects.toThrow('Database error');
    });
    
    it('should implement connection retry logic', async () => {
      dbService.pool.query
        .mockRejectedValueOnce(new Error('Connection lost'))
        .mockResolvedValueOnce([{ id: 1 }]);
      
      const result = await dbService.query('SELECT * FROM test');
      
      expect(result).toEqual([{ id: 1 }]);
      expect(dbService.pool.query).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('healthCheck()', () => {
    it('should return healthy status when connected', async () => {
      dbService.pool.query.mockResolvedValue([{ result: 1 }]);
      
      const health = await dbService.healthCheck();
      
      expect(health).toEqual({ status: 'healthy', connected: true });
    });
    
    it('should return unhealthy status when disconnected', async () => {
      dbService.pool.query.mockRejectedValue(new Error('Connection failed'));
      
      const health = await dbService.healthCheck();
      
      expect(health).toEqual({ 
        status: 'unhealthy', 
        connected: false,
        error: 'Connection failed'
      });
    });
  });
});
```

## Integration Testing

### Route Integration Tests

```javascript
// test/integration/routes/items.test.js
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import DynamicApiServer from '../../../src/server.js';

describe('Items API Routes', () => {
  let server;
  let app;
  
  beforeAll(async () => {
    server = new DynamicApiServer();
    await server.initialize();
    app = server.app;
  });
  
  afterAll(async () => {
    await server.shutdown();
  });
  
  describe('GET /items', () => {
    it('should return list of items', async () => {
      const response = await request(app)
        .get('/items')
        .expect(200);
      
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('item_id');
      expect(response.body[0]).toHaveProperty('item_name');
    });
    
    it('should filter items by category', async () => {
      const response = await request(app)
        .get('/items?category=electronics')
        .expect(200);
      
      expect(response.body).toBeInstanceOf(Array);
      response.body.forEach(item => {
        expect(item.category).toBe('electronics');
      });
    });
    
    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/items?limit=10&offset=20')
        .expect(200);
      
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeLessThanOrEqual(10);
    });
  });
  
  describe('GET /items/:id', () => {
    it('should return single item by ID', async () => {
      const response = await request(app)
        .get('/items/123')
        .expect(200);
      
      expect(response.body).toHaveProperty('item_id', '123');
    });
    
    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .get('/items/999999')
        .expect(404);
      
      expect(response.body).toHaveProperty('error', 'Item not found');
    });
  });
});
```

### Database Integration Tests

```javascript
// test/integration/database/connection.test.js
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import DatabaseService from '../../../src/services/DatabaseService.js';

describe('Database Connection', () => {
  let db;
  
  beforeAll(async () => {
    // Use test database connection string
    const connectionString = process.env.TEST_DB_CONNECTION_STRING;
    db = new DatabaseService(connectionString);
    await db.initialize();
  });
  
  afterAll(async () => {
    await db.close();
  });
  
  it('should connect to database', async () => {
    const health = await db.healthCheck();
    expect(health.status).toBe('healthy');
  });
  
  it('should execute simple query', async () => {
    const result = await db.query('SELECT 1 as test');
    expect(result[0]).toHaveProperty('test', 1);
  });
  
  it('should handle transactions', async () => {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      await connection.query("INSERT INTO test_table (name) VALUES ('test')");
      await connection.commit();
      
      const result = await db.query("SELECT * FROM test_table WHERE name = 'test'");
      expect(result).toHaveLength(1);
    } finally {
      // Cleanup
      await db.query("DELETE FROM test_table WHERE name = 'test'");
      connection.release();
    }
  });
});
```

## End-to-End Testing

### API Workflow Tests

```javascript
// test/e2e/api-workflow.test.js
import { describe, it, expect, beforeAll } from '@jest/globals';
import axios from 'axios';

const API_URL = process.env.TEST_API_URL || 'http://localhost:3000';

describe('E2E API Workflow', () => {
  let authToken;
  
  beforeAll(async () => {
    // Ensure server is running
    await axios.get(`${API_URL}/health`);
  });
  
  describe('Complete CRUD Workflow', () => {
    let createdItemId;
    
    it('should authenticate user', async () => {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username: 'testuser',
        password: 'testpass'
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('token');
      authToken = response.data.token;
    });
    
    it('should create new item', async () => {
      const response = await axios.post(`${API_URL}/items`, {
        name: 'Test Item',
        category: 'test',
        price: 99.99
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('item_id');
      createdItemId = response.data.item_id;
    });
    
    it('should retrieve created item', async () => {
      const response = await axios.get(`${API_URL}/items/${createdItemId}`);
      
      expect(response.status).toBe(200);
      expect(response.data.name).toBe('Test Item');
    });
    
    it('should update item', async () => {
      const response = await axios.put(`${API_URL}/items/${createdItemId}`, {
        price: 89.99
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.price).toBe(89.99);
    });
    
    it('should delete item', async () => {
      const response = await axios.delete(`${API_URL}/items/${createdItemId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      expect(response.status).toBe(204);
    });
    
    it('should verify item deletion', async () => {
      try {
        await axios.get(`${API_URL}/items/${createdItemId}`);
        fail('Should have thrown 404 error');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });
  });
});
```

## Performance Testing

### Load Testing with Artillery

```yaml
# test/performance/load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"
  processor: "./processor.js"

scenarios:
  - name: "Browse Items"
    weight: 60
    flow:
      - get:
          url: "/items"
      - think: 5
      - get:
          url: "/items/{{ $randomNumber(1, 100) }}"
  
  - name: "Search and Filter"
    weight: 30
    flow:
      - get:
          url: "/items?category=electronics"
      - get:
          url: "/items?search=laptop&limit=20"
  
  - name: "Create Item"
    weight: 10
    flow:
      - post:
          url: "/auth/login"
          json:
            username: "testuser"
            password: "testpass"
          capture:
            - json: "$.token"
              as: "authToken"
      - post:
          url: "/items"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            name: "Load Test Item {{ $randomString(8) }}"
            category: "test"
            price: "{{ $randomNumber(10, 1000) }}"
```

### Performance Benchmarks

```javascript
// test/performance/benchmarks.test.js
import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { performance } from 'perf_hooks';

describe('Performance Benchmarks', () => {
  describe('Response Time', () => {
    it('should respond to GET /items within 200ms', async () => {
      const start = performance.now();
      await request(app).get('/items');
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(200);
    });
    
    it('should handle 100 concurrent requests', async () => {
      const requests = Array(100).fill().map(() => 
        request(app).get('/items')
      );
      
      const start = performance.now();
      await Promise.all(requests);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(5000); // 5 seconds for 100 requests
    });
  });
  
  describe('Memory Usage', () => {
    it('should not leak memory on repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make 1000 requests
      for (let i = 0; i < 1000; i++) {
        await request(app).get('/items');
      }
      
      // Force garbage collection if available
      if (global.gc) global.gc();
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Should not increase by more than 50MB
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});
```

## Test Data Management

### Fixtures

```javascript
// test/fixtures/test-data.js
export const testItems = [
  { item_id: '1', item_name: 'Test Item 1', category: 'electronics', price: 99.99 },
  { item_id: '2', item_name: 'Test Item 2', category: 'books', price: 19.99 },
  { item_id: '3', item_name: 'Test Item 3', category: 'electronics', price: 299.99 }
];

export const testUsers = [
  { user_id: '1', username: 'testuser', role: 'admin' },
  { user_id: '2', username: 'regularuser', role: 'user' }
];

export const testRouteConfig = {
  path: '/test',
  method: 'GET',
  sql: 'SELECT * FROM test_table',
  response: { type: 'array' }
};
```

### Database Seeding

```javascript
// test/fixtures/seed-database.js
import DatabaseService from '../../src/services/DatabaseService.js';
import { testItems, testUsers } from './test-data.js';

export async function seedDatabase(db) {
  // Clear existing data
  await db.query('DELETE FROM items WHERE item_id LIKE "TEST_%"');
  await db.query('DELETE FROM users WHERE username LIKE "test%"');
  
  // Insert test items
  for (const item of testItems) {
    await db.query(
      'INSERT INTO items (item_id, item_name, category, price) VALUES (?, ?, ?, ?)',
      [`TEST_${item.item_id}`, item.item_name, item.category, item.price]
    );
  }
  
  // Insert test users
  for (const user of testUsers) {
    await db.query(
      'INSERT INTO users (user_id, username, role) VALUES (?, ?, ?)',
      [`TEST_${user.user_id}`, user.username, user.role]
    );
  }
}

export async function cleanupDatabase(db) {
  await db.query('DELETE FROM items WHERE item_id LIKE "TEST_%"');
  await db.query('DELETE FROM users WHERE username LIKE "test%"');
}
```

## Code Coverage

### Jest Configuration

```javascript
// jest.config.js
export default {
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/index.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '**/test/**/*.test.js'
  ],
  setupFilesAfterEnv: ['./test/setup.js'],
  testTimeout: 10000
};
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      db:
        image: mcr.microsoft.com/mssql/server:2019-latest
        env:
          ACCEPT_EULA: Y
          SA_PASSWORD: TestPass123!
        ports:
          - 1433:1433
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        env:
          TEST_DB_CONNECTION_STRING: "Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=testdb;UID=sa;PWD=TestPass123!"
        run: npm run test:integration
      
      - name: Run E2E tests
        run: |
          npm start &
          sleep 5
          npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## NPM Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest test/unit",
    "test:integration": "jest test/integration",
    "test:e2e": "jest test/e2e",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:performance": "artillery run test/performance/load-test.yml",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

## Testing Best Practices

### 1. Test Pyramid
- **Many Unit Tests**: Fast, isolated, test individual functions
- **Some Integration Tests**: Test component interactions
- **Few E2E Tests**: Test complete user workflows

### 2. Test Naming Convention
```javascript
describe('ComponentName', () => {
  describe('methodName()', () => {
    it('should [expected behavior] when [condition]', () => {
      // Test implementation
    });
  });
});
```

### 3. AAA Pattern
```javascript
it('should return user by ID', async () => {
  // Arrange
  const userId = '123';
  const expectedUser = { id: '123', name: 'Test User' };
  
  // Act
  const result = await userService.getUserById(userId);
  
  // Assert
  expect(result).toEqual(expectedUser);
});
```

### 4. Test Isolation
- Each test should be independent
- Use beforeEach/afterEach for setup/cleanup
- Mock external dependencies
- Use test database for integration tests

### 5. Continuous Testing
- Run tests on every commit
- Maintain > 80% code coverage
- Fix failing tests immediately
- Review test quality in code reviews

## Summary

This testing strategy ensures:
1. **Reliability**: Comprehensive test coverage
2. **Maintainability**: Clear test structure and naming
3. **Performance**: Regular performance benchmarks
4. **Quality**: Automated testing in CI/CD
5. **Documentation**: Tests serve as living documentation
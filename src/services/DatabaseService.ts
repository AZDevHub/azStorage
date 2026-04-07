import odbc from 'odbc';
import type { DatabaseConfig } from '../types/route.types.js';

/**
 * Query result structure
 */
export interface QueryResult {
  success: boolean;
  data?: any;
  error?: string;
  rowCount?: number;
}

/**
 * Connection pool configuration
 */
export interface PoolConfig {
  connectionString: string;
  reuseConnections?: boolean;
  initialSize?: number;
  incrementSize?: number;
  maxSize?: number;
  shrink?: boolean;
  connectionTimeout?: number;
  loginTimeout?: number;
  fetchArray?: boolean;
}

/**
 * Database Service
 * Handles ODBC connections and query execution for IBM i
 */
export class DatabaseService {
  protected config: DatabaseConfig & { env?: string; cistools?: string };
  protected pool: odbc.Pool | null = null;
  protected isInitialized: boolean = false;

  constructor(config: Partial<DatabaseConfig> = {}) {
    this.config = {
      connectionString: config.connectionString || this.buildDefaultConnectionString(),
      env: config.env || process.env.MAPICS_ENV || 'QQ',
      libraries: config.libraries || process.env[process.env.MAPICS_ENV || 'QQ'],
      cistools: config.cistools || process.env.CISTOOLS,
      poolSize: config.poolSize || 10,
      connectionTimeout: config.connectionTimeout || 600,
      ...config
    };
  }

  /**
   * Build IBM i optimized connection string
   */
  protected buildDefaultConnectionString(): string {
    // Check for environment-specific DSN
    const env = process.env.MAPICS_ENV || 'QQ';
    if (process.env[`DSN_${env}`]) {
      return `DSN=${process.env[`DSN_${env}`]};`;
    }

    // Build comprehensive IBM i connection string
    const params = [
      'Description=ODBC Pase Environment',
      'Driver=IBM i Access ODBC Driver 64-bit',
      'System=dev1.cistech.net',
      'UserID=ZAWA',
      'Password=zawa123',
      `DefaultLibraries=,${process.env[env] || 'QSYS2'}`,
      'ForceTranslation=1',
      'DateFormat=4',
      'TimeFormat=0',
      'ExtendedColInfo=1',
      'LazyClose=0',
      'Naming=1',
      'LibraryView=0',
      'HexParserOpt=0',
      'AllowUnsupportedChar=1',
      'CCSID=0',
      'CommitMode=0',
      'ConnectionType=0',
      'TrueAutoCommit=0',
      'TrimCharFields=1',
      'AllowProcCalls=1',
      'DBCSNoTruncError=1'
    ];

    return params.join(';');
  }

  /**
   * Get connection string (with optional override)
   */
  public getConnectionString(customConfig?: string): string {
    return customConfig || this.config.connectionString;
  }

  /**
   * Initialize connection pool
   */
  public async initialize(): Promise<void> {
    try {
      console.log('Initializing IBM i database connection pool...');
      
      const poolConfig: PoolConfig = {
        connectionString: this.getConnectionString(),
        reuseConnections: true,
        initialSize: this.config.poolSize || 10,
        incrementSize: 5,
        maxSize: 50,
        shrink: true,
        connectionTimeout: this.config.connectionTimeout || 600,
        loginTimeout: 10,
        fetchArray: false
      };

      this.pool = await odbc.pool(poolConfig);
      this.isInitialized = true;
      
      console.log('✅ IBM i database connection pool initialized successfully');
      console.log(`Environment: ${this.config.env}`);
      console.log(`Libraries: ${this.config.libraries}`);
    } catch (error) {
      console.error('❌ Failed to initialize database connection pool:', error);
      throw error;
    }
  }

  /**
   * Get a connection from the pool
   */
  protected async getConnection(customConfig?: string): Promise<odbc.Connection> {
    if (customConfig) {
      // Create a new connection with custom config
      const customPool = await odbc.pool({ connectionString: customConfig });
      return await customPool.connect();
    }

    if (!this.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return await this.pool.connect();
  }

  /**
   * Execute a SQL query
   */
  public async executeQuery(sql: string, parameters: any[] = []): Promise<QueryResult> {
    let connection: odbc.Connection | null = null;
    
    try {
      connection = await this.getConnection();
      
      // Execute query with or without parameters
      const result = parameters.length > 0 
        ? await connection.query(sql, parameters)
        : await connection.query(sql);
      
      return {
        success: true,
        data: result,
        rowCount: Array.isArray(result) ? result.length : undefined
      };
    } catch (error: any) {
      console.error('Query execution error:', error);
      return {
        success: false,
        error: error.message || 'Unknown database error'
      };
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  /**
   * Execute a query with specific library list
   */
  public async queryWithLibraries(sql: string, parameters: any[] = [], libraries: string[]): Promise<QueryResult> {
    let connection: odbc.Connection | null = null;
    
    try {
      connection = await this.getConnection();
      
      // Set library list
      const libListSql = `CALL QSYS.QCMDEXC('CHGLIBL LIBL(${libraries.join(' ')})' , ${String(17 + libraries.join(' ').length).padStart(15, '0')}.00000)`;
      await connection.query(libListSql);
      
      // Execute the actual query
      const result = parameters.length > 0
        ? await connection.query(sql, parameters)
        : await connection.query(sql);
      
      return {
        success: true,
        data: result,
        rowCount: Array.isArray(result) ? result.length : undefined
      };
    } catch (error: any) {
      console.error('Query with libraries error:', error);
      return {
        success: false,
        error: error.message || 'Unknown database error'
      };
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  public async executeTransaction(queries: Array<{ sql: string; parameters?: any[] }>): Promise<QueryResult> {
    let connection: odbc.Connection | null = null;
    
    try {
      connection = await this.getConnection();
      await connection.beginTransaction();
      
      const results: any[] = [];
      
      for (const query of queries) {
        const result = query.parameters && query.parameters.length > 0
          ? await connection.query(query.sql, query.parameters)
          : await connection.query(query.sql);
        results.push(result);
      }
      
      await connection.commit();
      
      return {
        success: true,
        data: results
      };
    } catch (error: any) {
      if (connection) {
        await connection.rollback();
      }
      console.error('Transaction error:', error);
      return {
        success: false,
        error: error.message || 'Transaction failed'
      };
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  /**
   * Call a stored procedure
   */
  public async callProcedure(procedureName: string, parameters: any[] = []): Promise<QueryResult> {
    const placeholders = parameters.map(() => '?').join(',');
    const sql = `CALL ${procedureName}(${placeholders})`;
    return await this.executeQuery(sql, parameters);
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{ healthy: boolean; status: string }> {
    try {
      const result = await this.executeQuery('SELECT 1 FROM SYSIBM.SYSDUMMY1');
      return {
        healthy: result.success,
        status: result.success ? 'Connected' : 'Connection failed'
      };
    } catch (error) {
      return {
        healthy: false,
        status: 'Health check failed'
      };
    }
  }

  /**
   * Get connection pool statistics
   */
  public getConnectionStats(): any {
    if (!this.pool) {
      return { status: 'Not initialized' };
    }
    
    // Note: odbc library might not expose these stats directly
    // This is a placeholder for potential statistics
    return {
      initialized: this.isInitialized,
      environment: this.config.env,
      libraries: this.config.libraries,
      poolSize: this.config.poolSize
    };
  }

  /**
   * Close all connections and cleanup
   */
  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      this.isInitialized = false;
      console.log('Database connection pool closed');
    }
  }

  /**
   * Test connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      const connection = await this.getConnection();
      await connection.close();
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

export default DatabaseService;

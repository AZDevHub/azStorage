import { Router, Request, Response } from 'express';
import { apiReference } from '@scalar/express-api-reference';
import OpenAPIGenerator from '../services/OpenAPIGenerator.js';
import { getAvailableApps } from '../config/routes.js';

/**
 * API Documentation Router
 * Provides OpenAPI specs and Scalar interactive documentation
 */
export class ApiDocRouter {
  private router: Router;
  private openApiGenerator: OpenAPIGenerator;

  constructor() {
    this.router = Router();
    this.openApiGenerator = new OpenAPIGenerator();
    this.setupRoutes();
  }

  /**
   * Setup all documentation routes
   */
  private setupRoutes(): void {
    // OpenAPI spec endpoints
    this.router.get('/openapi.json', this.getFullSpec.bind(this));
    this.router.get('/openapi/:appName.json', this.getAppSpec.bind(this));
    
    // List available apps
    this.router.get('/apps', this.listApps.bind(this));
    
    // Scalar documentation viewers
    this.setupScalarRoutes();
    
    // Documentation UI with app selector
    this.router.get('/ui', this.getDocumentationUI.bind(this));
  }

  /**
   * Get full OpenAPI specification
   */
  private getFullSpec(_req: Request, res: Response): void {
    try {
      const spec = this.openApiGenerator.generateOpenAPISpec();
      res.json(spec);
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to generate OpenAPI specification',
        details: error.message
      });
    }
  }

  /**
   * Get app-specific OpenAPI specification
   */
  private getAppSpec(req: Request, res: Response): void {
    try {
      const { appName } = req.params;
      const spec = this.openApiGenerator.generateOpenAPISpec(appName);
      res.json(spec);
    } catch (error: any) {
      const statusCode = error.message.includes('No routes found') ? 404 : 500;
      res.status(statusCode).json({
        error: `Failed to generate OpenAPI specification for app: ${req.params.appName}`,
        details: error.message
      });
    }
  }

  /**
   * List available apps
   */
  private listApps(_req: Request, res: Response): void {
    try {
      const apps = getAvailableApps();
      res.json({
        apps: apps.map(app => ({
          name: app.name,
          displayName: app.displayName,
          description: app.description,
          version: app.version
        }))
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to list available apps',
        details: error.message
      });
    }
  }

  /**
   * Setup Scalar documentation routes
   */
  private setupScalarRoutes(): void {
    // Full API documentation
    this.router.use(
      '/reference',
      apiReference({
        url: '/docs/openapi.json',
        ...this.getScalarConfig('IBM i REST API Documentation')
      })
    );

    // App-specific documentation with dynamic configuration
    this.router.use(
      '/reference/:appName',
      (req: Request, res: Response, _next): any => {
        const { appName } = req.params;
        const apps = getAvailableApps();
        
        if (!apps.find(app => app.name === appName)) {
          return res.status(404).json({
            error: `App '${appName}' not found`,
            availableApps: apps.map(a => a.name)
          });
        }

        // Use Scalar with dynamic spec URL
        const appInfo = apps.find(app => app.name === appName);
        const middleware = apiReference({
          url: `/docs/openapi/${appName}.json`,
          ...this.getScalarConfig(
            `${appInfo?.displayName || appName} API Documentation`,
            appInfo?.description
          )
        });

        return middleware(req, res);
      }
    );
  }

  /**
   * Get Scalar configuration
   */
  private getScalarConfig(title: string, description?: string): any {
    return {
      theme: 'default',
      layout: 'modern',
      darkMode: true,
      hideDarkModeToggle: false,
      searchHotKey: 'k',
      showSidebar: true,
      customCss: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
        
        .scalar-api-reference {
          --scalar-font: 'Inter', sans-serif;
        }
      `,
      metaData: {
        title,
        description: description || 'Dynamic REST API server for IBM i systems',
        ogDescription: description || 'Comprehensive API documentation for IBM i integration services',
        ogTitle: title,
        twitterCard: 'summary_large_image'
      },
      hideModels: false,
      hideDownloadButton: false,
      hiddenClients: [],
      authentication: {
        preferredSecurityScheme: 'bearerAuth'
      }
    };
  }

  /**
   * Get documentation UI with app selector
   */
  private getDocumentationUI(_req: Request, res: Response): void {
    const apps = getAvailableApps();
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>IBM i API Documentation</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          
          .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 1.5rem 2rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          .header-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          h1 {
            font-size: 1.75rem;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .app-selector-container {
            display: flex;
            align-items: center;
            gap: 1rem;
          }
          
          .app-selector-container label {
            font-weight: 500;
            color: #4a5568;
          }
          
          select {
            padding: 0.5rem 1rem;
            border: 2px solid #e2e8f0;
            border-radius: 0.5rem;
            background: white;
            font-family: inherit;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.2s;
            min-width: 200px;
          }
          
          select:hover {
            border-color: #667eea;
          }
          
          select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }
          
          .main-content {
            flex: 1;
            padding: 2rem;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          
          .card {
            background: white;
            border-radius: 1rem;
            padding: 3rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            width: 100%;
          }
          
          .app-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
          }
          
          .app-card {
            padding: 1.5rem;
            border: 2px solid #e2e8f0;
            border-radius: 0.5rem;
            transition: all 0.2s;
            cursor: pointer;
            text-decoration: none;
            color: inherit;
          }
          
          .app-card:hover {
            border-color: #667eea;
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          }
          
          .app-card h3 {
            color: #2d3748;
            margin-bottom: 0.5rem;
            font-size: 1.125rem;
          }
          
          .app-card p {
            color: #718096;
            font-size: 0.875rem;
            line-height: 1.5;
          }
          
          .buttons {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
          }
          
          .button {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
            display: inline-block;
            text-align: center;
            font-family: inherit;
          }
          
          .button-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          
          .button-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(102, 126, 234, 0.3);
          }
          
          .button-secondary {
            background: #f7fafc;
            color: #4a5568;
            border: 2px solid #e2e8f0;
          }
          
          .button-secondary:hover {
            background: #edf2f7;
            border-color: #cbd5e0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-content">
            <h1>IBM i API Documentation</h1>
            <div class="app-selector-container">
              <label for="app-selector">Select App:</label>
              <select id="app-selector" onchange="navigateToApp(this.value)">
                <option value="">Choose an app...</option>
                <option value="all">All APIs</option>
                ${apps.map(app => `
                  <option value="${app.name}">${app.displayName}</option>
                `).join('')}
              </select>
            </div>
          </div>
        </div>
        
        <div class="main-content">
          <div class="card">
            <h2 style="margin-bottom: 1rem; color: #2d3748;">Available API Applications</h2>
            <p style="color: #718096; margin-bottom: 2rem;">
              Select an application below to view its API documentation, or choose "All APIs" to see the complete API reference.
            </p>
            
            <div class="app-grid">
              <a href="/docs/reference" class="app-card">
                <h3>📚 All APIs</h3>
                <p>View complete API documentation for all available endpoints</p>
              </a>
              ${apps.map(app => `
                <a href="/docs/reference/${app.name}" class="app-card">
                  <h3>${this.getAppIcon(app.name)} ${app.displayName}</h3>
                  <p>${app.description || 'No description available'}</p>
                </a>
              `).join('')}
            </div>
            
            <div class="buttons">
              <a href="/docs/openapi.json" class="button button-secondary" target="_blank">
                Download OpenAPI Spec
              </a>
              <a href="/docs/reference" class="button button-primary">
                View Full Documentation
              </a>
            </div>
          </div>
        </div>
        
        <script>
          function navigateToApp(appName) {
            if (!appName) return;
            
            if (appName === 'all') {
              window.location.href = '/docs/reference';
            } else {
              window.location.href = '/docs/reference/' + appName;
            }
          }
        </script>
      </body>
      </html>
    `;
    
    res.send(html);
  }

  /**
   * Get icon for app (helper method)
   */
  private getAppIcon(appName: string): string {
    const icons: Record<string, string> = {
      'auth': '🔐',
      'system-services': '⚙️',
      'user-management': '👥',
      'sample': '🧪'
    };
    return icons[appName] || '📦';
  }

  /**
   * Get the router instance
   */
  public getRouter(): Router {
    return this.router;
  }
}

export default ApiDocRouter;

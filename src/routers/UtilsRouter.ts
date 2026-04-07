import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService.js';
import { CLCommandService } from '../services/CLCommandService.js';
import { ShellCommandService } from '../services/ShellCommandService.js';
import { SystemInfoScript } from '../scripts/system-info.js';
import { JobMonitorScript } from '../scripts/job-monitor.js';
import { FileOperationsScript } from '../scripts/file-operations.js';

export class UtilsRouter {
    private router: Router;
    private clService: CLCommandService;
    private shellService: ShellCommandService;
    private systemInfo: SystemInfoScript;
    private jobMonitor: JobMonitorScript;
    private fileOps: FileOperationsScript;

    constructor(databaseService: DatabaseService) {
        this.router = Router();
        
        // Initialize services
        this.clService = new CLCommandService(databaseService);
        this.shellService = new ShellCommandService();
        
        // Initialize scripts
        this.systemInfo = new SystemInfoScript(this.shellService, this.clService);
        this.jobMonitor = new JobMonitorScript(this.shellService, this.clService, databaseService);
        this.fileOps = new FileOperationsScript(this.shellService, databaseService);
        
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // CL Command endpoints
        this.router.post('/cl/execute', async (req: Request, res: Response): Promise<void> => {
            try {
                const { command, libraryList } = req.body;
                
                if (!command) {
                    res.status(400).json({ error: 'Command is required' });
                    return;
                }
                
                const result = await this.clService.executeCLCommand(command, { libraryList });
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.post('/cl/execute-with-output', async (req: Request, res: Response): Promise<void> => {
            try {
                const { command, libraryList } = req.body;
                
                if (!command) {
                    res.status(400).json({ error: 'Command is required' });
                    return;
                }
                
                const result = await this.clService.executeCLWithOutput(command, { libraryList });
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        // Shell Command endpoints
        this.router.post('/shell/execute', async (req: Request, res: Response): Promise<void> => {
            try {
                const { command, args = [], timeout } = req.body;
                
                if (!command) {
                    res.status(400).json({ error: 'Command is required' });
                    return;
                }
                
                const result = timeout 
                    ? await this.shellService.executeCommand(command, args, { timeout })
                    : await this.shellService.executeCommand(command, args);
                    
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.post('/shell/execute-streaming', async (req: Request, res: Response): Promise<void> => {
            try {
                const { command, args = [] } = req.body;
                
                if (!command) {
                    res.status(400).json({ error: 'Command is required' });
                    return;
                }
                
                // Set up SSE
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                });
                
                const result = await this.shellService.executeCommandStream(command, args, (data: string) => {
                    res.write(`data: ${JSON.stringify({ type: 'stdout', data })}\\n\\n`);
                });
                
                res.write(`data: ${JSON.stringify({ type: 'complete', result })}\\n\\n`);
                res.end();
            } catch (error: any) {
                res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\\n\\n`);
                res.end();
            }
        });

        // System Info endpoints
        this.router.get('/system/info', async (_req: Request, res: Response) => {
            try {
                const info = await this.systemInfo.getFullSystemInfo();
                res.json(info);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.get('/system/os', async (_req: Request, res: Response) => {
            try {
                const info = await this.systemInfo.getOSInfo();
                res.json(info);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.get('/system/disk', async (_req: Request, res: Response) => {
            try {
                const info = await this.systemInfo.getDiskInfo();
                res.json(info);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.get('/system/memory', async (_req: Request, res: Response) => {
            try {
                const info = await this.systemInfo.getMemoryInfo();
                res.json(info);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.get('/system/cpu', async (_req: Request, res: Response) => {
            try {
                const info = await this.systemInfo.getCPUInfo();
                res.json(info);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.get('/system/network', async (_req: Request, res: Response) => {
            try {
                const info = await this.systemInfo.getNetworkInfo();
                res.json(info);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.get('/system/processes', async (_req: Request, res: Response) => {
            try {
                const info = await this.systemInfo.getProcessInfo();
                res.json(info);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.get('/system/ibmi', async (_req: Request, res: Response) => {
            try {
                const info = await this.systemInfo.getIBMiInfo();
                res.json(info);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        // Job Monitor endpoints
        this.router.get('/jobs/active', async (req: Request, res: Response) => {
            try {
                const { subsystem, jobName, user } = req.query;
                const result = await this.jobMonitor.getActiveJobs({ 
                    subsystem: subsystem as string, 
                    jobName: jobName as string, 
                    user: user as string 
                });
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.get('/jobs/:jobName', async (req: Request, res: Response) => {
            try {
                const result = await this.jobMonitor.getJobDetails(req.params.jobName);
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.get('/jobs/:jobName/log', async (req: Request, res: Response) => {
            try {
                const { severity = 0 } = req.query;
                const result = await this.jobMonitor.getJobLog(req.params.jobName, parseInt(severity as string));
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.get('/jobs/queue/info', async (req: Request, res: Response) => {
            try {
                const { library = '*LIBL', jobQueue = '*ALL' } = req.query;
                const result = await this.jobMonitor.getJobQueueInfo(library as string, jobQueue as string);
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.get('/jobs/subsystems', async (_req: Request, res: Response) => {
            try {
                const result = await this.jobMonitor.getSubsystemInfo();
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.get('/jobs/performance', async (_req: Request, res: Response) => {
            try {
                const result = await this.jobMonitor.getSystemPerformance();
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.get('/jobs/long-running', async (req: Request, res: Response) => {
            try {
                const { minutes = 60 } = req.query;
                const result = await this.jobMonitor.getLongRunningJobs(parseInt(minutes as string));
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.get('/jobs/high-cpu', async (req: Request, res: Response) => {
            try {
                const { threshold = 10 } = req.query;
                const result = await this.jobMonitor.getHighCPUJobs(parseInt(threshold as string));
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.post('/jobs/:jobName/end', async (req: Request, res: Response) => {
            try {
                const { option = '*IMMED' } = req.body;
                const result = await this.jobMonitor.endJob(req.params.jobName, option);
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.post('/jobs/:jobName/hold', async (req: Request, res: Response) => {
            try {
                const result = await this.jobMonitor.holdJob(req.params.jobName);
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.post('/jobs/:jobName/release', async (req: Request, res: Response) => {
            try {
                const result = await this.jobMonitor.releaseJob(req.params.jobName);
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        // File Operations endpoints
        this.router.get('/files/list', async (req: Request, res: Response) => {
            try {
                const { path = '.', sortByTime, sortBySize, recursive } = req.query;
                const result = await this.fileOps.listFiles(path as string, {
                    sortByTime: sortByTime === 'true',
                    sortBySize: sortBySize === 'true',
                    recursive: recursive === 'true'
                });
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.get('/files/ifs/list', async (req: Request, res: Response) => {
            try {
                const { path = '/' } = req.query;
                const result = await this.fileOps.listIFSDirectory(path as string);
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.get('/files/ifs/info', async (req: Request, res: Response): Promise<void> => {
            try {
                const { path } = req.query;
                
                if (!path) {
                    res.status(400).json({ error: 'Path is required' });
                    return;
                }
                
                const result = await this.fileOps.getIFSFileInfo(path as string);
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.get('/files/read', async (req: Request, res: Response): Promise<void> => {
            try {
                const { path, useIFS, tail, lines, maxLines } = req.query;
                
                if (!path) {
                    res.status(400).json({ error: 'Path is required' });
                    return;
                }
                
                const result = await this.fileOps.readFile(path as string, {
                    useIFS: useIFS === 'true',
                    tail: tail === 'true',
                    lines: lines ? parseInt(lines as string) : undefined,
                    maxLines: maxLines ? parseInt(maxLines as string) : undefined
                });
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.post('/files/ifs/write', async (req: Request, res: Response): Promise<void> => {
            try {
                const { path, content, append, ccsid } = req.body;
                
                if (!path || content === undefined) {
                    res.status(400).json({ error: 'Path and content are required' });
                    return;
                }
                
                const result = await this.fileOps.writeIFSFile(path, content, {
                    append: append === true,
                    ccsid: ccsid
                });
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.post('/files/copy', async (req: Request, res: Response): Promise<void> => {
            try {
                const { source, destination } = req.body;
                
                if (!source || !destination) {
                    res.status(400).json({ error: 'Source and destination are required' });
                    return;
                }
                
                const result = await this.fileOps.copyFile(source, destination);
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.post('/files/move', async (req: Request, res: Response): Promise<void> => {
            try {
                const { source, destination } = req.body;
                
                if (!source || !destination) {
                    res.status(400).json({ error: 'Source and destination are required' });
                    return;
                }
                
                const result = await this.fileOps.moveFile(source, destination);
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.delete('/files/delete', async (req: Request, res: Response): Promise<void> => {
            try {
                const { path, force, recursive } = req.body;
                
                if (!path) {
                    res.status(400).json({ error: 'Path is required' });
                    return;
                }
                
                const result = await this.fileOps.deleteFile(path, {
                    force: force === true,
                    recursive: recursive === true
                });
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.post('/files/directory/create', async (req: Request, res: Response): Promise<void> => {
            try {
                const { path, parents } = req.body;
                
                if (!path) {
                    res.status(400).json({ error: 'Path is required' });
                    return;
                }
                
                const result = await this.fileOps.createDirectory(path, {
                    parents: parents === true
                });
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.get('/files/permissions', async (req: Request, res: Response): Promise<void> => {
            try {
                const { path } = req.query;
                
                if (!path) {
                    res.status(400).json({ error: 'Path is required' });
                    return;
                }
                
                const result = await this.fileOps.getFilePermissions(path as string);
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.post('/files/permissions/change', async (req: Request, res: Response): Promise<void> => {
            try {
                const { path, mode } = req.body;
                
                if (!path || !mode) {
                    res.status(400).json({ error: 'Path and mode are required' });
                    return;
                }
                
                const result = await this.fileOps.changePermissions(path, mode);
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.get('/files/find', async (req: Request, res: Response) => {
            try {
                const { searchPath = '.', pattern, type, maxDepth } = req.query;
                
                const result = await this.fileOps.findFiles(searchPath as string, pattern as string, {
                    type: type as string,
                    maxDepth: maxDepth ? parseInt(maxDepth as string) : undefined
                });
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        this.router.get('/files/disk-usage', async (req: Request, res: Response) => {
            try {
                const { path = '.' } = req.query;
                const result = await this.fileOps.getDiskUsage(path as string);
                res.json(result);
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    getRouter(): Router {
        return this.router;
    }
}

export default UtilsRouter;

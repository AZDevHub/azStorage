import { CLCommandService } from '../services/CLCommandService.js';
import { ShellCommandService } from '../services/ShellCommandService.js';

/**
 * System Information Utility Script
 * Provides various system information endpoints
 */
export class SystemInfoScript {
    private shellService: ShellCommandService;
    private clService: CLCommandService;

    constructor(shellService: ShellCommandService, clService: CLCommandService) {
        this.shellService = shellService;
        this.clService = clService;
    }

    /**
     * Get comprehensive system information
     */
    async getFullSystemInfo(): Promise<any> {
        const [osInfo, diskInfo, memInfo, cpuInfo] = await Promise.all([
            this.getOSInfo(),
            this.getDiskInfo(),
            this.getMemoryInfo(),
            this.getCPUInfo()
        ]);

        return {
            os: osInfo,
            disk: diskInfo,
            memory: memInfo,
            cpu: cpuInfo,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get OS information
     */
    async getOSInfo(): Promise<any> {
        try {
            const result = await this.shellService.executeCommand('uname', ['-a']);
            const hostname = await this.shellService.executeCommand('hostname');
            
            return {
                system: result.stdout.trim(),
                hostname: hostname.stdout.trim(),
                platform: process.platform,
                architecture: process.arch,
                nodeVersion: process.version
            };
        } catch (error: any) {
            return { error: error.message };
        }
    }

    /**
     * Get disk usage information
     */
    async getDiskInfo(): Promise<any> {
        try {
            const result = await this.shellService.executeCommand('df', ['-h']);
            const lines = result.stdout.split('\n').filter(line => line.trim());
            const header = lines[0].split(/\s+/);
            const data = lines.slice(1).map(line => {
                const values = line.split(/\s+/);
                const disk: any = {};
                header.forEach((col, index) => {
                    disk[col.toLowerCase()] = values[index];
                });
                return disk;
            });
            
            return data;
        } catch (error: any) {
            return { error: error.message };
        }
    }

    /**
     * Get memory information
     */
    async getMemoryInfo(): Promise<any> {
        try {
            const result = await this.shellService.executeCommand('free', ['-b']);
            const lines = result.stdout.split('\n').filter(line => line.trim());
            
            const memLine = lines.find(line => line.startsWith('Mem:'));
            if (memLine) {
                const values = memLine.split(/\s+/);
                return {
                    total: parseInt(values[1]),
                    used: parseInt(values[2]),
                    free: parseInt(values[3]),
                    shared: parseInt(values[4] || '0'),
                    buffers: parseInt(values[5] || '0'),
                    available: parseInt(values[6] || values[3])
                };
            }
            
            return {};
        } catch (error: any) {
            return { error: error.message };
        }
    }

    /**
     * Get CPU information
     */
    async getCPUInfo(): Promise<any> {
        try {
            const result = await this.shellService.executeCommand('cat', ['/proc/cpuinfo']);
            const lines = result.stdout.split('\n');
            
            const cpuInfo: any = {
                processors: [],
                cores: 0
            };
            
            let currentProcessor: any = {};
            lines.forEach(line => {
                if (line.trim() === '') {
                    if (Object.keys(currentProcessor).length > 0) {
                        cpuInfo.processors.push(currentProcessor);
                        currentProcessor = {};
                    }
                } else {
                    const [key, ...valueParts] = line.split(':');
                    if (key && valueParts.length > 0) {
                        const cleanKey = key.trim().replace(/\s+/g, '_').toLowerCase();
                        currentProcessor[cleanKey] = valueParts.join(':').trim();
                    }
                }
            });
            
            cpuInfo.cores = cpuInfo.processors.length;
            
            // Get CPU model
            if (cpuInfo.processors.length > 0) {
                cpuInfo.model = cpuInfo.processors[0].model_name || 'Unknown';
            }
            
            return cpuInfo;
        } catch (error: any) {
            // Fallback for systems without /proc/cpuinfo
            const os = await import('os');
            return {
                cores: os.cpus().length,
                model: os.cpus()[0]?.model || 'Unknown',
                error: 'Limited CPU info available'
            };
        }
    }

    /**
     * Get network information
     */
    async getNetworkInfo(): Promise<any> {
        try {
            const os = await import('os');
            const interfaces = os.networkInterfaces();
            const result: any = {};
            
            for (const [name, addresses] of Object.entries(interfaces)) {
                if (addresses) {
                    result[name] = addresses.map(addr => ({
                        address: addr.address,
                        netmask: addr.netmask,
                        family: addr.family,
                        internal: addr.internal
                    }));
                }
            }
            
            return result;
        } catch (error: any) {
            return { error: error.message };
        }
    }

    /**
     * Get process information
     */
    async getProcessInfo(): Promise<any> {
        try {
            const result = await this.shellService.executeCommand('ps', ['aux', '--sort=-pcpu', '|', 'head', '-20']);
            const lines = result.stdout.split('\n').filter(line => line.trim());
            
            if (lines.length === 0) return [];
            
            const header = lines[0].split(/\s+/);
            const processes = lines.slice(1).map(line => {
                const values = line.split(/\s+/);
                const proc: any = {};
                header.forEach((col, index) => {
                    proc[col.toLowerCase()] = values[index];
                });
                return proc;
            });
            
            return processes;
        } catch (error: any) {
            return { error: error.message };
        }
    }

    /**
     * Get IBM i specific information
     */
    async getIBMiInfo(): Promise<any> {
        try {
            const [systemStatusResult, libraryListResult] = await Promise.all([
                this.clService.getSystemStatus(),
                this.clService.displayLibraryList()
            ]);

            return {
                systemStatus: {
                    success: systemStatusResult.success,
                    output: systemStatusResult.stdout || systemStatusResult.result,
                    error: systemStatusResult.error
                },
                libraryList: {
                    success: libraryListResult.success,
                    output: libraryListResult.stdout || libraryListResult.result,
                    error: libraryListResult.error
                },
                timestamp: new Date().toISOString()
            };
        } catch (error: any) {
            return { error: error.message };
        }
    }
}

export default SystemInfoScript;

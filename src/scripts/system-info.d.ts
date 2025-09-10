import { CLCommandService } from '../services/CLCommandService.js';
import { ShellCommandService } from '../services/ShellCommandService.js';

declare class SystemInfoScript {
    constructor(shellService: ShellCommandService, clService: CLCommandService);
    getFullSystemInfo(): Promise<any>;
    getOSInfo(): Promise<any>;
    getDiskInfo(): Promise<any>;
    getMemoryInfo(): Promise<any>;
    getCPUInfo(): Promise<any>;
    getNetworkInfo(): Promise<any>;
    getProcessInfo(): Promise<any>;
    getIBMiInfo(): Promise<any>;
}

export default SystemInfoScript;

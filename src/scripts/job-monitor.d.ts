import { CLCommandService } from '../services/CLCommandService.js';
import { ShellCommandService } from '../services/ShellCommandService.js';
import { DatabaseService } from '../services/DatabaseService.js';

declare class JobMonitorScript {
    constructor(shellService: ShellCommandService, clService: CLCommandService, dbService: DatabaseService);
    getActiveJobs(filter?: { subsystem?: string; jobName?: string; user?: string }): Promise<any>;
    getJobDetails(jobName: string): Promise<any>;
    getJobLog(jobName: string, severity?: number): Promise<any>;
    getJobQueueInfo(library?: string, jobQueue?: string): Promise<any>;
    getSubsystemInfo(): Promise<any>;
    getSystemPerformance(): Promise<any>;
    endJob(jobName: string, option?: string): Promise<any>;
    holdJob(jobName: string): Promise<any>;
    releaseJob(jobName: string): Promise<any>;
    getLongRunningJobs(minutes?: number): Promise<any>;
    getHighCPUJobs(cpuThreshold?: number): Promise<any>;
}

export default JobMonitorScript;

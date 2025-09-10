import { CLCommandService } from '../services/CLCommandService.js';
import { ShellCommandService } from '../services/ShellCommandService.js';
import { DatabaseService } from '../services/DatabaseService.js';

interface JobFilter {
    subsystem?: string;
    jobName?: string;
    user?: string;
}

/**
 * Job Monitoring Utility Script
 * Provides job monitoring and management capabilities
 */
export class JobMonitorScript {
    private clService: CLCommandService;
    private dbService: DatabaseService;

    constructor(_shellService: ShellCommandService, clService: CLCommandService, dbService: DatabaseService) {
        this.clService = clService;
        this.dbService = dbService;
    }

    /**
     * Get active jobs from IBM i
     */
    async getActiveJobs(filter: JobFilter = {}): Promise<any> {
        try {
            let sql = `
                SELECT 
                    JOB_NAME,
                    SUBSYSTEM,
                    AUTHORIZATION_NAME as USER_NAME,
                    JOB_TYPE,
                    JOB_STATUS,
                    CPU_TIME,
                    ELAPSED_TIME,
                    FUNCTION,
                    FUNCTION_TYPE
                FROM TABLE(QSYS2.ACTIVE_JOB_INFO(
                    SUBSYSTEM_LIST_FILTER => ?,
                    JOB_NAME_FILTER => ?,
                    CURRENT_USER_LIST_FILTER => ?
                )) AS X
                ORDER BY CPU_TIME DESC
                FETCH FIRST 100 ROWS ONLY
            `;

            const params = [
                filter.subsystem || '',
                filter.jobName || '',
                filter.user || ''
            ];

            const result = await this.dbService.executeQuery(sql, params);
            
            if (result.success) {
                return {
                    success: true,
                    jobs: result.data,
                    count: result.rowCount
                };
            }
            
            return result;
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get job details
     */
    async getJobDetails(jobName: string): Promise<any> {
        try {
            const sql = `
                SELECT *
                FROM TABLE(QSYS2.GET_JOB_INFO('${jobName}')) AS X
            `;

            const result = await this.dbService.executeQuery(sql);
            
            if (result.success && result.data && result.data.length > 0) {
                return {
                    success: true,
                    job: result.data[0]
                };
            }
            
            return {
                success: false,
                error: 'Job not found'
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get job log entries
     */
    async getJobLog(jobName: string, severity: number = 0): Promise<any> {
        try {
            const sql = `
                SELECT 
                    ORDINAL_POSITION,
                    MESSAGE_ID,
                    MESSAGE_TYPE,
                    MESSAGE_SUBTYPE,
                    SEVERITY,
                    MESSAGE_TIMESTAMP,
                    FROM_LIBRARY,
                    FROM_PROGRAM,
                    MESSAGE_TEXT
                FROM TABLE(QSYS2.JOBLOG_INFO('${jobName}')) AS X
                WHERE SEVERITY >= ${severity}
                ORDER BY ORDINAL_POSITION DESC
                FETCH FIRST 100 ROWS ONLY
            `;

            const result = await this.dbService.executeQuery(sql);
            
            if (result.success) {
                return {
                    success: true,
                    messages: result.data,
                    count: result.rowCount
                };
            }
            
            return result;
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Monitor job queue
     */
    async getJobQueueInfo(library: string = '*LIBL', jobQueue: string = '*ALL'): Promise<any> {
        try {
            const sql = `
                SELECT 
                    JOB_QUEUE_NAME,
                    JOB_QUEUE_LIBRARY,
                    JOB_QUEUE_STATUS,
                    NUMBER_OF_JOBS,
                    SUBSYSTEM_NAME,
                    SUBSYSTEM_LIBRARY_NAME,
                    MAXIMUM_ACTIVE,
                    CURRENT_ACTIVE,
                    SEQUENCE_NUMBER
                FROM QSYS2.JOB_QUEUE_INFO
                WHERE (JOB_QUEUE_LIBRARY = '${library}' OR '${library}' = '*LIBL')
                  AND (JOB_QUEUE_NAME = '${jobQueue}' OR '${jobQueue}' = '*ALL')
                ORDER BY NUMBER_OF_JOBS DESC
            `;

            const result = await this.dbService.executeQuery(sql);
            
            if (result.success) {
                return {
                    success: true,
                    queues: result.data,
                    count: result.rowCount
                };
            }
            
            return result;
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get subsystem information
     */
    async getSubsystemInfo(): Promise<any> {
        try {
            const sql = `
                SELECT 
                    SUBSYSTEM_NAME,
                    SUBSYSTEM_LIBRARY_NAME,
                    STATUS,
                    MAXIMUM_ACTIVE_JOBS,
                    CURRENT_ACTIVE_JOBS,
                    SIGNON_DEVICE_FILE_LIBRARY,
                    SIGNON_DEVICE_FILE,
                    SECONDARY_LANGUAGE_LIBRARY
                FROM QSYS2.SUBSYSTEM_INFO
                ORDER BY CURRENT_ACTIVE_JOBS DESC
            `;

            const result = await this.dbService.executeQuery(sql);
            
            if (result.success) {
                return {
                    success: true,
                    subsystems: result.data,
                    count: result.rowCount
                };
            }
            
            return result;
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Monitor system performance
     */
    async getSystemPerformance(): Promise<any> {
        try {
            const sql = `
                SELECT 
                    ELAPSED_TIME,
                    ELAPSED_CPU_USED,
                    ELAPSED_CPU_PERCENTAGE,
                    CONFIGURED_CPUS,
                    AVERAGE_CPU_RATE,
                    MAXIMUM_CPU_RATE,
                    MINIMUM_CPU_RATE,
                    SQL_CPU_UTILIZATION
                FROM QSYS2.SYSTEM_STATUS_INFO
            `;

            const result = await this.dbService.executeQuery(sql);
            
            if (result.success && result.data && result.data.length > 0) {
                return {
                    success: true,
                    performance: result.data[0]
                };
            }
            
            return result;
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * End a job
     */
    async endJob(jobName: string, option: string = '*IMMED'): Promise<any> {
        return this.clService.executeCLCommand(`ENDJOB JOB(${jobName}) OPTION(${option})`);
    }

    /**
     * Hold a job
     */
    async holdJob(jobName: string): Promise<any> {
        return this.clService.executeCLCommand(`HLDJOB JOB(${jobName})`);
    }

    /**
     * Release a job
     */
    async releaseJob(jobName: string): Promise<any> {
        return this.clService.executeCLCommand(`RLSJOB JOB(${jobName})`);
    }

    /**
     * Get long running jobs
     */
    async getLongRunningJobs(minutes: number = 60): Promise<any> {
        try {
            const sql = `
                SELECT 
                    JOB_NAME,
                    AUTHORIZATION_NAME,
                    JOB_TYPE,
                    JOB_STATUS,
                    ELAPSED_TIME,
                    ELAPSED_CPU_TIME,
                    ELAPSED_TOTAL_DISK_IO_COUNT,
                    FUNCTION
                FROM TABLE(QSYS2.ACTIVE_JOB_INFO()) AS X
                WHERE ELAPSED_TIME > ${minutes * 60}
                ORDER BY ELAPSED_TIME DESC
                FETCH FIRST 50 ROWS ONLY
            `;

            const result = await this.dbService.executeQuery(sql);
            
            if (result.success) {
                return {
                    success: true,
                    jobs: result.data,
                    count: result.rowCount,
                    thresholdMinutes: minutes
                };
            }
            
            return result;
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get high CPU jobs
     */
    async getHighCPUJobs(cpuThreshold: number = 10): Promise<any> {
        try {
            const sql = `
                SELECT 
                    JOB_NAME,
                    AUTHORIZATION_NAME,
                    JOB_TYPE,
                    CPU_TIME,
                    ELAPSED_CPU_PERCENTAGE,
                    FUNCTION,
                    FUNCTION_TYPE,
                    TEMPORARY_STORAGE
                FROM TABLE(QSYS2.ACTIVE_JOB_INFO()) AS X
                WHERE ELAPSED_CPU_PERCENTAGE > ${cpuThreshold}
                ORDER BY ELAPSED_CPU_PERCENTAGE DESC
                FETCH FIRST 20 ROWS ONLY
            `;

            const result = await this.dbService.executeQuery(sql);
            
            if (result.success) {
                return {
                    success: true,
                    jobs: result.data,
                    count: result.rowCount,
                    cpuThreshold: cpuThreshold
                };
            }
            
            return result;
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export default JobMonitorScript;

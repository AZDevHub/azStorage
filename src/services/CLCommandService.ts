import { DatabaseService } from './DatabaseService.js';
import { ShellCommandService } from './ShellCommandService.js';

interface CLCommandOptions {
  libraryList?: string[];
  timeout?: number;
}

interface CLCommandResult {
  success: boolean;
  command: string;
  result?: any;
  error?: string;
  executionTime?: number;
  stdout?: string;
  stderr?: string;
}

/**
 * Service for executing IBM i CL commands via shell system calls
 */
export class CLCommandService {
  private shellService: ShellCommandService;

  constructor(_databaseService: DatabaseService) {
    this.shellService = new ShellCommandService();
  }

  /**
   * Execute CL command via system shell call
   */
  async executeCLCommand(command: string, options: CLCommandOptions = {}): Promise<CLCommandResult> {
    try {
      // Validate command
      if (!command || typeof command !== 'string') {
        throw new Error('Invalid CL command provided');
      }

      const startTime = Date.now();

      // Add library list if provided
      if (options.libraryList && options.libraryList.length > 0) {
        const libListCommand = `CHGLIBL LIBL(${options.libraryList.join(' ')})`;
        await this.shellService.executeCommand('system', [libListCommand]);
      }

      console.log(`Executing CL command: ${command}`);
      
      // Execute via system command
      const result = await this.shellService.executeCommand('system', [command], {
        timeout: options.timeout
      });
      
      const executionTime = Date.now() - startTime;

      return {
        success: result.success,
        command,
        result: result.success ? 'Command executed successfully' : undefined,
        stdout: result.stdout,
        stderr: result.stderr,
        error: result.success ? undefined : result.stderr || 'Command execution failed',
        executionTime
      };
      
    } catch (error: any) {
      console.error('CL Command execution error:', error);
      return {
        success: false,
        command,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Execute CL command with detailed output capture
   */
  async executeCLWithOutput(command: string, options: CLCommandOptions = {}): Promise<CLCommandResult> {
    try {
      const startTime = Date.now();

      // Use message queue approach for capturing output
      const messageQueueCommand = `SNDPGMMSG MSG('${command}') TOPGMQ(*SAME)`;
      const result = await this.executeCLCommand(messageQueueCommand, options);
      
      const executionTime = Date.now() - startTime;

      if (result.success) {
        // Also execute the original command
        const originalResult = await this.executeCLCommand(command, options);
        
        return {
          success: originalResult.success,
          command,
          result: {
            command: originalResult.result,
            message: result.result,
            executionTime
          }
        };
      }

      return result;

    } catch (error: any) {
      return {
        success: false,
        command,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Execute multiple CL commands in sequence
   */
  async executeBatch(commands: string[], options: CLCommandOptions = {}): Promise<CLCommandResult[]> {
    const results: CLCommandResult[] = [];
    
    for (const command of commands) {
      const result = await this.executeCLCommand(command, options);
      results.push(result);
      
      // Stop on first error if not configured to continue
      if (!result.success && !options.timeout) {
        break;
      }
    }
    
    return results;
  }

  /**
   * Get system status via CL command
   */
  async getSystemStatus(): Promise<CLCommandResult> {
    return this.executeCLCommand('WRKSYSSTS');
  }

  /**
   * Get active jobs via CL command
   */
  async getActiveJobs(): Promise<CLCommandResult> {
    return this.executeCLCommand('WRKACTJOB');
  }

  /**
   * Get subsystem information
   */
  async getSubsystems(): Promise<CLCommandResult> {
    return this.executeCLCommand('WRKSBSD');
  }

  /**
   * Display library list
   */
  async displayLibraryList(): Promise<CLCommandResult> {
    return this.executeCLCommand('DSPLIBL');
  }

  /**
   * Change library list
   */
  async changeLibraryList(libraries: string[]): Promise<CLCommandResult> {
    const libraryListString = libraries.join(' ');
    return this.executeCLCommand(`CHGLIBL LIBL(${libraryListString})`);
  }

  /**
   * Display system values
   */
  async displaySystemValues(systemValue?: string): Promise<CLCommandResult> {
    const command = systemValue ? `DSPSYSVAL SYSVAL(${systemValue})` : 'DSPSYSVAL';
    return this.executeCLCommand(command);
  }

  /**
   * Send message to job queue
   */
  async sendMessage(message: string, messageQueue: string = '*SYSOPR'): Promise<CLCommandResult> {
    return this.executeCLCommand(`SNDMSG MSG('${message}') TOMSGQ(${messageQueue})`);
  }

  /**
   * Create save file
   */
  async createSaveFile(library: string, saveFile: string): Promise<CLCommandResult> {
    return this.executeCLCommand(`CRTSAVF FILE(${library}/${saveFile})`);
  }

  /**
   * Delete save file
   */
  async deleteSaveFile(library: string, saveFile: string): Promise<CLCommandResult> {
    return this.executeCLCommand(`DLTF FILE(${library}/${saveFile})`);
  }
}

export default CLCommandService;

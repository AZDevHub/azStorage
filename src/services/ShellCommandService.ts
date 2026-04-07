import { spawn, ChildProcess, SpawnOptions } from 'child_process';

interface ShellCommandOptions extends SpawnOptions {
  timeout?: number;
  encoding?: BufferEncoding;
}

interface ShellCommandResult {
  success: boolean;
  command: string;
  args: string[];
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executionTime: number;
  processId?: string;
}

/**
 * Service for executing shell commands using child_process.spawn
 */
export class ShellCommandService {
  private activeProcesses: Map<string, ChildProcess>;

  constructor() {
    this.activeProcesses = new Map();
  }

  /**
   * Execute shell command using spawn (same thread)
   */
  async executeCommand(
    command: string, 
    args: string[] = [], 
    options: ShellCommandOptions = {}
  ): Promise<ShellCommandResult> {
    return new Promise((resolve) => {
      const processId = Date.now().toString();
      const startTime = Date.now();
      
      console.log(`Executing shell command: ${command} ${args.join(' ')}`);
      
      const childProcess = spawn(command, args, {
        shell: true,
        ...options
      });

      this.activeProcesses.set(processId, childProcess);

      let stdout = '';
      let stderr = '';

      childProcess.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString(options.encoding || 'utf8');
      });

      childProcess.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString(options.encoding || 'utf8');
      });

      childProcess.on('error', (error: Error) => {
        this.activeProcesses.delete(processId);
        resolve({
          success: false,
          command,
          args,
          stdout,
          stderr: error.message,
          exitCode: null,
          executionTime: Date.now() - startTime,
          processId
        });
      });

      childProcess.on('close', (code: number | null) => {
        this.activeProcesses.delete(processId);
        const executionTime = Date.now() - startTime;
        
        resolve({
          success: code === 0,
          command,
          args,
          stdout,
          stderr,
          exitCode: code,
          executionTime,
          processId
        });
      });

      // Handle timeout
      if (options.timeout) {
        setTimeout(() => {
          if (this.activeProcesses.has(processId)) {
            childProcess.kill('SIGTERM');
            this.activeProcesses.delete(processId);
            resolve({
              success: false,
              command,
              args,
              stdout,
              stderr: 'Command timed out',
              exitCode: null,
              executionTime: Date.now() - startTime,
              processId
            });
          }
        }, options.timeout);
      }
    });
  }

  /**
   * Execute command with streaming output
   */
  async executeCommandStream(
    command: string,
    args: string[] = [],
    onData?: (data: string) => void,
    options: ShellCommandOptions = {}
  ): Promise<ShellCommandResult> {
    return new Promise((resolve) => {
      const processId = Date.now().toString();
      const startTime = Date.now();
      
      const childProcess = spawn(command, args, {
        shell: true,
        ...options
      });

      this.activeProcesses.set(processId, childProcess);

      let stdout = '';
      let stderr = '';

      childProcess.stdout?.on('data', (data: Buffer) => {
        const output = data.toString(options.encoding || 'utf8');
        stdout += output;
        if (onData) {
          onData(output);
        }
      });

      childProcess.stderr?.on('data', (data: Buffer) => {
        const output = data.toString(options.encoding || 'utf8');
        stderr += output;
        if (onData) {
          onData(output);
        }
      });

      childProcess.on('close', (code: number | null) => {
        this.activeProcesses.delete(processId);
        resolve({
          success: code === 0,
          command,
          args,
          stdout,
          stderr,
          exitCode: code,
          executionTime: Date.now() - startTime,
          processId
        });
      });

      childProcess.on('error', (error: Error) => {
        this.activeProcesses.delete(processId);
        resolve({
          success: false,
          command,
          args,
          stdout,
          stderr: error.message,
          exitCode: null,
          executionTime: Date.now() - startTime,
          processId
        });
      });
    });
  }

  /**
   * Kill a running process
   */
  killProcess(processId: string): boolean {
    const process = this.activeProcesses.get(processId);
    if (process) {
      process.kill('SIGTERM');
      this.activeProcesses.delete(processId);
      return true;
    }
    return false;
  }

  /**
   * Get list of active processes
   */
  getActiveProcesses(): string[] {
    return Array.from(this.activeProcesses.keys());
  }

  /**
   * Kill all active processes
   */
  killAllProcesses(): number {
    const count = this.activeProcesses.size;
    for (const [, process] of this.activeProcesses) {
      process.kill('SIGTERM');
    }
    this.activeProcesses.clear();
    return count;
  }

  // Convenience methods for common commands

  /**
   * Execute system info command
   */
  async getSystemInfo(): Promise<ShellCommandResult> {
    return this.executeCommand('uname', ['-a']);
  }

  /**
   * Execute disk usage command
   */
  async getDiskUsage(path: string = '/'): Promise<ShellCommandResult> {
    return this.executeCommand('df', ['-h', path]);
  }

  /**
   * Execute memory info command
   */
  async getMemoryInfo(): Promise<ShellCommandResult> {
    return this.executeCommand('free', ['-h']);
  }

  /**
   * Execute process list command
   */
  async getProcessList(): Promise<ShellCommandResult> {
    return this.executeCommand('ps', ['-aux']);
  }

  /**
   * Execute network connections command
   */
  async getNetworkConnections(): Promise<ShellCommandResult> {
    return this.executeCommand('netstat', ['-tuln']);
  }

  /**
   * Execute file listing command
   */
  async listFiles(directory: string, options: string[] = ['-la']): Promise<ShellCommandResult> {
    return this.executeCommand('ls', [...options, directory]);
  }

  /**
   * Execute file operations
   */
  async copyFile(source: string, destination: string): Promise<ShellCommandResult> {
    return this.executeCommand('cp', [source, destination]);
  }

  async moveFile(source: string, destination: string): Promise<ShellCommandResult> {
    return this.executeCommand('mv', [source, destination]);
  }

  async deleteFile(filePath: string): Promise<ShellCommandResult> {
    return this.executeCommand('rm', [filePath]);
  }

  async createDirectory(dirPath: string): Promise<ShellCommandResult> {
    return this.executeCommand('mkdir', ['-p', dirPath]);
  }

  async deleteDirectory(dirPath: string): Promise<ShellCommandResult> {
    return this.executeCommand('rm', ['-rf', dirPath]);
  }
}

export default ShellCommandService;

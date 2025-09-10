import { ShellCommandService } from '../services/ShellCommandService.js';
import { DatabaseService } from '../services/DatabaseService.js';

interface FileListOptions {
    sortByTime?: boolean;
    sortBySize?: boolean;
    recursive?: boolean;
}

interface ReadFileOptions {
    useIFS?: boolean;
    tail?: boolean;
    lines?: number;
    maxLines?: number;
}

interface WriteFileOptions {
    append?: boolean;
    ccsid?: number;
}

interface DeleteOptions {
    force?: boolean;
    recursive?: boolean;
}

interface DirectoryOptions {
    parents?: boolean;
}

interface FindOptions {
    type?: string;
    maxDepth?: number;
}

interface FileInfo {
    permissions: string;
    links: number;
    owner: string;
    group: string;
    size: number;
    month: string;
    day: string;
    timeOrYear: string;
    name: string;
}

/**
 * File Operations Utility Script
 * Provides file system operations for both Unix and IBM i IFS
 */
export class FileOperationsScript {
    private shellService: ShellCommandService;
    private dbService: DatabaseService;

    constructor(shellService: ShellCommandService, dbService: DatabaseService) {
        this.shellService = shellService;
        this.dbService = dbService;
    }

    /**
     * List files in a directory
     */
    async listFiles(path: string = '.', options: FileListOptions = {}): Promise<any> {
        try {
            const args = ['-la'];
            if (options.sortByTime) args.push('-t');
            if (options.sortBySize) args.push('-S');
            if (options.recursive) args.push('-R');
            args.push(path);

            const result = await this.shellService.executeCommand('ls', args);
            
            if (result.success) {
                const lines = result.stdout.split('\n').filter(line => line.trim());
                const files = this.parseListOutput(lines);
                
                return {
                    success: true,
                    path: path,
                    files: files,
                    count: files.length
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
     * Parse ls output into structured data
     */
    parseListOutput(lines: string[]): FileInfo[] {
        const files: FileInfo[] = [];
        
        // Skip the total line if present
        const startIndex = lines[0]?.startsWith('total') ? 1 : 0;
        
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            const parts = line.split(/\s+/);
            
            if (parts.length >= 9) {
                files.push({
                    permissions: parts[0],
                    links: parseInt(parts[1]),
                    owner: parts[2],
                    group: parts[3],
                    size: parseInt(parts[4]),
                    month: parts[5],
                    day: parts[6],
                    timeOrYear: parts[7],
                    name: parts.slice(8).join(' ')
                });
            }
        }
        
        return files;
    }

    /**
     * Get file information using IFS
     */
    async getIFSFileInfo(path: string): Promise<any> {
        try {
            const sql = `
                SELECT 
                    PATH_NAME,
                    OBJECT_TYPE,
                    DATA_SIZE,
                    ALLOCATED_SIZE,
                    CREATE_TIMESTAMP,
                    ACCESS_TIMESTAMP,
                    DATA_CHANGE_TIMESTAMP,
                    OWNER,
                    AUTHORIZATION_LIST_NAME,
                    CCSID
                FROM TABLE(QSYS2.IFS_OBJECT_STATISTICS('${path}')) AS X
            `;

            const result = await this.dbService.executeQuery(sql);
            
            if (result.success && result.data && result.data.length > 0) {
                return {
                    success: true,
                    file: result.data[0]
                };
            }
            
            return {
                success: false,
                error: 'File not found'
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * List IFS directory contents
     */
    async listIFSDirectory(path: string = '/'): Promise<any> {
        try {
            const sql = `
                SELECT 
                    PATH_NAME,
                    OBJECT_TYPE,
                    DATA_SIZE,
                    CREATE_TIMESTAMP,
                    DATA_CHANGE_TIMESTAMP,
                    OWNER
                FROM TABLE(QSYS2.IFS_OBJECT_STATISTICS('${path}/*')) AS X
                ORDER BY OBJECT_TYPE, PATH_NAME
            `;

            const result = await this.dbService.executeQuery(sql);
            
            if (result.success) {
                return {
                    success: true,
                    path: path,
                    entries: result.data,
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
     * Read file content
     */
    async readFile(path: string, options: ReadFileOptions = {}): Promise<any> {
        try {
            if (options.useIFS) {
                // Read using IFS
                const sql = `
                    SELECT LINE 
                    FROM TABLE(QSYS2.IFS_READ('${path}'))
                    ${options.maxLines ? `FETCH FIRST ${options.maxLines} ROWS ONLY` : ''}
                `;

                const result = await this.dbService.executeQuery(sql);
                
                if (result.success && result.data) {
                    const content = result.data.map((row: any) => row.LINE).join('\n');
                    return {
                        success: true,
                        path: path,
                        content: content,
                        lines: result.rowCount
                    };
                }
                
                return result;
            } else {
                // Read using shell command
                const command = options.tail ? 'tail' : 'cat';
                const args = options.tail ? ['-n', (options.lines || 100).toString(), path] : [path];
                
                const result = await this.shellService.executeCommand(command, args);
                
                if (result.success) {
                    return {
                        success: true,
                        path: path,
                        content: result.stdout,
                        lines: result.stdout.split('\n').length
                    };
                }
                
                return result;
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Write content to file using IFS
     */
    async writeIFSFile(path: string, content: string, options: WriteFileOptions = {}): Promise<any> {
        try {
            const sql = `
                CALL QSYS2.IFS_WRITE('${path}', '${content.replace(/'/g, "''")}', 
                    ${options.append ? "APPEND => 'YES'" : "OVERWRITE => 'REPLACE'"},
                    ${options.ccsid ? `FILE_CCSID => ${options.ccsid}` : 'FILE_CCSID => 1208'})
            `;

            const result = await this.dbService.executeQuery(sql);
            
            return {
                success: result.success,
                path: path,
                bytesWritten: content.length,
                message: result.success ? 'File written successfully' : result.error
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Copy file
     */
    async copyFile(source: string, destination: string): Promise<any> {
        try {
            const result = await this.shellService.executeCommand('cp', ['-p', source, destination]);
            
            return {
                success: result.success,
                source: source,
                destination: destination,
                message: result.success ? 'File copied successfully' : result.stderr
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Move/rename file
     */
    async moveFile(source: string, destination: string): Promise<any> {
        try {
            const result = await this.shellService.executeCommand('mv', [source, destination]);
            
            return {
                success: result.success,
                source: source,
                destination: destination,
                message: result.success ? 'File moved successfully' : result.stderr
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete file
     */
    async deleteFile(path: string, options: DeleteOptions = {}): Promise<any> {
        try {
            const args = options.force ? ['-f', path] : [path];
            if (options.recursive) args.unshift('-r');
            
            const result = await this.shellService.executeCommand('rm', args);
            
            return {
                success: result.success,
                path: path,
                message: result.success ? 'File deleted successfully' : result.stderr
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create directory
     */
    async createDirectory(path: string, options: DirectoryOptions = {}): Promise<any> {
        try {
            const args = options.parents ? ['-p', path] : [path];
            
            const result = await this.shellService.executeCommand('mkdir', args);
            
            return {
                success: result.success,
                path: path,
                message: result.success ? 'Directory created successfully' : result.stderr
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get file permissions
     */
    async getFilePermissions(path: string): Promise<any> {
        try {
            const sql = `
                SELECT 
                    PATH_NAME,
                    OWNER,
                    AUTHORIZATION_LIST_NAME,
                    OWNER_PERMISSION,
                    PRIMARY_GROUP_PERMISSION,
                    PUBLIC_PERMISSION
                FROM TABLE(QSYS2.IFS_OBJECT_PRIVILEGES('${path}')) AS X
            `;

            const result = await this.dbService.executeQuery(sql);
            
            if (result.success && result.data && result.data.length > 0) {
                return {
                    success: true,
                    permissions: result.data[0]
                };
            }
            
            return {
                success: false,
                error: 'Unable to get permissions'
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Change file permissions
     */
    async changePermissions(path: string, mode: string): Promise<any> {
        try {
            const result = await this.shellService.executeCommand('chmod', [mode, path]);
            
            return {
                success: result.success,
                path: path,
                mode: mode,
                message: result.success ? 'Permissions changed successfully' : result.stderr
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Search for files
     */
    async findFiles(searchPath: string, pattern?: string, options: FindOptions = {}): Promise<any> {
        try {
            const args = [searchPath];
            
            if (options.type) {
                args.push('-type', options.type);
            }
            
            if (pattern) {
                args.push('-name', pattern);
            }
            
            if (options.maxDepth) {
                args.push('-maxdepth', options.maxDepth.toString());
            }
            
            const result = await this.shellService.executeCommand('find', args);
            
            if (result.success) {
                const files = result.stdout.split('\n').filter(line => line.trim());
                
                return {
                    success: true,
                    files: files,
                    count: files.length
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
     * Get disk usage for path
     */
    async getDiskUsage(path: string = '.'): Promise<any> {
        try {
            const result = await this.shellService.executeCommand('du', ['-sh', path]);
            
            if (result.success) {
                const parts = result.stdout.trim().split('\t');
                
                return {
                    success: true,
                    path: path,
                    size: parts[0],
                    humanReadable: true
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

export default FileOperationsScript;

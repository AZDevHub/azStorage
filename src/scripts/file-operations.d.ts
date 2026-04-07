import { ShellCommandService } from '../../services/ShellCommandService.js';
import { DatabaseService } from '../../services/DatabaseService.js';

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

declare class FileOperationsScript {
    constructor(shellService: ShellCommandService, dbService: DatabaseService);
    listFiles(path?: string, options?: FileListOptions): Promise<any>;
    parseListOutput(lines: string[]): any[];
    getIFSFileInfo(path: string): Promise<any>;
    listIFSDirectory(path?: string): Promise<any>;
    readFile(path: string, options?: ReadFileOptions): Promise<any>;
    writeIFSFile(path: string, content: string, options?: WriteFileOptions): Promise<any>;
    copyFile(source: string, destination: string): Promise<any>;
    moveFile(source: string, destination: string): Promise<any>;
    deleteFile(path: string, options?: DeleteOptions): Promise<any>;
    createDirectory(path: string, options?: DirectoryOptions): Promise<any>;
    getFilePermissions(path: string): Promise<any>;
    changePermissions(path: string, mode: string): Promise<any>;
    findFiles(searchPath: string, pattern?: string, options?: FindOptions): Promise<any>;
    getDiskUsage(path?: string): Promise<any>;
}

export default FileOperationsScript;

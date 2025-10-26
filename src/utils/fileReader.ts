import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger';

export interface FileReadResult {
  success: boolean;
  data?: Buffer;
  contentType?: string;
  error?: string;
}

/**
 * Read file from filesystem for multipart uploads
 */
export class FileReader {
  /**
   * Read file and return buffer with content type detection
   */
  async readFile(filePath: string, workspaceRoot?: string): Promise<FileReadResult> {
    try {
      // Resolve relative paths
      let fullPath = filePath;
      if (!path.isAbsolute(filePath) && workspaceRoot) {
        // Remove leading ./ or .\ from relative paths
        const cleanPath = filePath.replace(/^\.[\\/]/, '');
        fullPath = path.join(workspaceRoot, cleanPath);
        logger.info(`Resolving file path: ${filePath} -> ${fullPath}`);
        logger.info(`Workspace root: ${workspaceRoot}`);
      } else {
        logger.info(`Using absolute path: ${fullPath}`);
      }

      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        logger.error(`File not found at: ${fullPath}`);
        logger.error(`Current directory: ${process.cwd()}`);
        return {
          success: false,
          error: `File not found: ${filePath}`, // This shows the original path
        };
      }

      // Read file
      const data = fs.readFileSync(fullPath);
      const contentType = this.detectContentType(fullPath);

      logger.info(`Read file: ${fullPath} (${data.length} bytes)`);

      return {
        success: true,
        data,
        contentType,
      };
    } catch (error) {
      logger.error(`Failed to read file ${filePath}: ${error}`);
      return {
        success: false,
        error: `Failed to read file: ${error}`,
      };
    }
  }

  /**
   * Detect content type from file extension
   */
  private detectContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();

    const mimeTypes: Record<string, string> = {
      // Images
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',

      // Documents
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

      // Text
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',

      // Archives
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.7z': 'application/x-7z-compressed',
      '.tar': 'application/x-tar',
      '.gz': 'application/gzip',

      // Audio/Video
      '.mp3': 'audio/mpeg',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.wav': 'audio/wav',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }
}

export const fileReader = new FileReader();

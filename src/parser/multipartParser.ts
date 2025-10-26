import { logger } from '../utils/logger';
import type { MultipartPart, ParseMultipartResult } from './multipartTypes';
import { MultipartRequest } from './multipartTypes';

/**
 * Parse multipart/form-data body content
 */
export class MultipartParser {
  /**
   * Parse multipart body and extract parts
   */
  parse(body: string, boundary: string): ParseMultipartResult {
    try {
      const parts: MultipartPart[] = [];

      // Split by boundary
      const sections = body.split(`--${boundary}`);

      // Skip first (empty) and last (closing boundary)
      for (let i = 1; i < sections.length - 1; i++) {
        const section = sections[i].trim();
        if (!section) continue;

        const part = this.parsePart(section);
        if (part) {
          parts.push(part);
        }
      }

      if (parts.length === 0) {
        return {
          success: false,
          error: 'No multipart parts found',
        };
      }

      const multipartRequest: MultipartRequest = {
        boundary,
        parts,
      };

      return {
        success: true,
        multipart: multipartRequest,
      };
    } catch (error) {
      logger.error(`Multipart parsing error: ${error}`);
      return {
        success: false,
        error: `Failed to parse multipart body: ${error}`,
      };
    }
  }

  /**
   * Parse a single multipart part
   */
  private parsePart(section: string): MultipartPart | null {
    const lines = section.split(/\r?\n/);
    const part: Partial<MultipartPart> = {};
    let headersDone = false;
    const valueLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Empty line marks end of headers
      if (!trimmed) {
        headersDone = true;
        continue;
      }

      if (!headersDone) {
        // Parse headers
        this.parsePartHeader(trimmed, part);
      } else {
        // Check for file reference
        if (trimmed.startsWith('<')) {
          const filePath = trimmed.substring(1).trim();
          part.filePath = filePath;
        } else {
          valueLines.push(line);
        }
      }
    }

    // Set value if not a file
    if (!part.filePath && valueLines.length > 0) {
      part.value = valueLines.join('\n').trim();
    }

    // Validate required fields
    if (!part.name) {
      logger.error('Multipart part missing required "name" field');
      return null;
    }

    return part as MultipartPart;
  }

  /**
   * Parse a single part header line
   */
  private parsePartHeader(line: string, part: Partial<MultipartPart>): void {
    // Handle Content-Disposition
    if (line.toLowerCase().startsWith('content-disposition:')) {
      const disposition = line.substring(20).trim();

      // Extract name
      const nameMatch = disposition.match(/name="([^"]+)"/);
      if (nameMatch) {
        part.name = nameMatch[1];
      }

      // Extract filename
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      if (filenameMatch) {
        part.filename = filenameMatch[1];
      }
    }

    // Handle Content-Type
    else if (line.toLowerCase().startsWith('content-type:')) {
      part.contentType = line.substring(13).trim();
    }

    // Handle simplified syntax (name: value)
    else if (line.includes(':')) {
      const colonIndex = line.indexOf(':');
      const key = line.substring(0, colonIndex).trim().toLowerCase();
      const value = line.substring(colonIndex + 1).trim();

      if (key === 'name') {
        part.name = value;
      } else if (key === 'filename') {
        part.filename = value;
      } else if (key === 'content-type') {
        part.contentType = value;
      }
    }
  }

  /**
   * Extract boundary from Content-Type header
   */
  static extractBoundary(contentType: string): string | null {
    const match = contentType.match(/boundary=([^;]+)/);
    if (match) {
      return match[1].trim().replace(/^["']|["']$/g, ''); // Remove quotes
    }
    return null;
  }

  /**
   * Generate a random boundary if not provided
   */
  static generateBoundary(): string {
    return `----WebKitFormBoundary${Math.random().toString(36).substring(2, 15)}`;
  }
}

export const multipartParser = new MultipartParser();

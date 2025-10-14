import { logger } from '../utils/logger';
import { HttpMethod } from '../types/common';
import { ParsedRequest, ParseError, ParseResult } from './types';

enum ParserState {
  READING_REQUEST_LINE = 'READING_REQUEST_LINE',
  READING_HEADERS = 'READING_HEADERS',
  READING_BODY = 'READING_BODY',
  COMPLETE = 'COMPLETE',
}

export class HttpParser {
  private static readonly HTTP_METHODS: Set<HttpMethod> = new Set([
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'HEAD',
    'OPTIONS',
  ]);

  private static readonly REQUEST_SEPARATORS = /^(\s*###\s*|\s*---\s*)$/;

  parse(content: string): ParseResult {
    try {
      const lines = content.split('\n');
      const requests: ParsedRequest[] = [];
      const errors: ParseError[] = [];

      let currentState = ParserState.READING_REQUEST_LINE;
      let currentRequest: Partial<ParsedRequest> | null = null;
      let currentLineNum = 0;
      let bodyLines: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        currentLineNum = i + 1;

        // Check for separator
        if (HttpParser.REQUEST_SEPARATORS.test(line)) {
          if (currentRequest && currentRequest.method) {
            currentRequest.body = bodyLines.join('\n').trim();
            requests.push(currentRequest as ParsedRequest);
            currentRequest = null;
            bodyLines = [];
          }
          currentState = ParserState.READING_REQUEST_LINE;
          continue;
        }

        // Skip empty lines and comments at top level
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
          if (currentState === ParserState.READING_HEADERS && !trimmed) {
            currentState = ParserState.READING_BODY;
          }
          continue;
        }

        // Parse request line
        if (currentState === ParserState.READING_REQUEST_LINE) {
          const result = this.parseRequestLine(line, currentLineNum);
          if (!result.success) {
            errors.push(result.error);
            continue;
          }
          currentRequest = result.request;
          currentState = ParserState.READING_HEADERS;
          bodyLines = [];
          continue;
        }

        // Parse headers
        if (currentState === ParserState.READING_HEADERS) {
          const headerResult = this.parseHeader(line, currentLineNum);
          if (!headerResult.success) {
            // Empty line after headers means body starts
            if (line.trim() === '') {
              currentState = ParserState.READING_BODY;
              continue;
            }
            errors.push(headerResult.error);
            continue;
          }
          const { key, value } = headerResult;
          if (!currentRequest!.headers) {
            currentRequest!.headers = new Map();
          }
          currentRequest!.headers.set(key, value);
          continue;
        }

        // Read body
        if (currentState === ParserState.READING_BODY) {
          bodyLines.push(line);
          continue;
        }
      }

      // Don't forget the last request
      if (currentRequest && currentRequest.method) {
        currentRequest.body = bodyLines.join('\n').trim();
        requests.push(currentRequest as ParsedRequest);
      }

      if (errors.length > 0) {
        return { success: false, errors };
      }

      // Assign IDs to requests
      requests.forEach((req, idx) => {
        req.id = `req-${idx + 1}`;
      });

      return { success: true, requests };
    } catch (error) {
      logger.error(`Parser error: ${error}`);
      return {
        success: false,
        errors: [{ message: `Unexpected parser error: ${error}`, lineNumber: 0 }],
      };
    }
  }

  private parseRequestLine(
    line: string,
    lineNumber: number
  ): { success: true; request: Partial<ParsedRequest> } | { success: false; error: ParseError } {
    const trimmed = line.trim();
    const parts = trimmed.split(/\s+/);

    if (parts.length < 2) {
      return {
        success: false,
        error: {
          message: 'Invalid request line. Expected: METHOD URL',
          lineNumber,
        },
      };
    }

    const method = parts[0].toUpperCase() as HttpMethod;
    const url = parts[1];

    if (!HttpParser.HTTP_METHODS.has(method)) {
      return {
        success: false,
        error: {
          message: `Invalid HTTP method: ${method}. Expected one of: ${Array.from(
            HttpParser.HTTP_METHODS
          ).join(', ')}`,
          lineNumber,
        },
      };
    }

    if (!this.isValidUrl(url)) {
      return {
        success: false,
        error: {
          message: `Invalid URL: ${url}. Expected absolute URL (e.g., https://example.com)`,
          lineNumber,
        },
      };
    }

    return {
      success: true,
      request: {
        method,
        url,
        headers: new Map(),
        lineNumber,
      },
    };
  }

  private parseHeader(
    line: string,
    lineNumber: number
  ): { success: true; key: string; value: string } | { success: false; error: ParseError } {
    const colonIndex = line.indexOf(':');

    if (colonIndex === -1) {
      return {
        success: false,
        error: {
          message: 'Invalid header format. Expected: Key: Value',
          lineNumber,
        },
      };
    }

    const key = line.substring(0, colonIndex).trim();
    const value = line.substring(colonIndex + 1).trim();

    if (!key) {
      return {
        success: false,
        error: {
          message: 'Header key cannot be empty',
          lineNumber,
        },
      };
    }

    return { success: true, key, value };
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      // Check if it might be a variable or needs env resolution
      if (url.includes('{{')) {
        return true;
      }
      return false;
    }
  }
}

export const httpParser = new HttpParser();
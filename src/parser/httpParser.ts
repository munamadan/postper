// src/parser/httpParser.ts - Enhanced version with robustness improvements

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

  // NEW: Methods that cannot have a request body
  private static readonly METHODS_WITHOUT_BODY: Set<HttpMethod> = new Set(['GET', 'HEAD']);

  // ENHANCED: More flexible separator detection
  private static readonly REQUEST_SEPARATORS = /^(\s*(#{3,}|---+)\s*)$/;

  parse(content: string): ParseResult {
    try {
      // ENHANCED: Handle Windows CRLF
      const lines = content.split(/\r?\n/);
      const requests: ParsedRequest[] = [];
      const errors: ParseError[] = [];

      let currentState = ParserState.READING_REQUEST_LINE;
      let currentRequest: Partial<ParsedRequest> | null = null;
      let currentLineNum = 0;
      let bodyLines: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        currentLineNum = i + 1;

        // ENHANCED: Check for separator (handles multiple consecutive separators)
        if (HttpParser.REQUEST_SEPARATORS.test(line)) {
          if (currentRequest && currentRequest.method) {
            // ENHANCED: Use new finalizeRequest method
            this.finalizeRequest(currentRequest, bodyLines);
            requests.push(currentRequest as ParsedRequest);
            currentRequest = null;
            bodyLines = [];
          }
          currentState = ParserState.READING_REQUEST_LINE;
          continue;
        }

        const trimmed = line.trim();

        // ENHANCED: Skip comment lines (# or //) when not in body
        if (currentState !== ParserState.READING_BODY && this.isCommentLine(trimmed)) {
          continue;
        }

        // Skip empty lines at top level
        if (currentState === ParserState.READING_REQUEST_LINE && !trimmed) {
          continue;
        }

        // Parse request line
        if (currentState === ParserState.READING_REQUEST_LINE) {
          if (!trimmed) {
            continue;
          }

          const result = this.parseRequestLine(line, currentLineNum);
          if (!result.success) {
            errors.push(result.error);
            continue; // ENHANCED: Continue parsing instead of stopping
          }

          // ✅ Add name extraction here
          currentRequest = result.request;
          currentRequest.name = this.extractRequestName(lines, i); // <-- integrated line
          currentState = ParserState.READING_HEADERS;
          bodyLines = [];
          continue;
        }

        // Parse headers
        if (currentState === ParserState.READING_HEADERS) {
          // ENHANCED: Skip comment lines in headers section
          if (this.isCommentLine(trimmed)) {
            continue;
          }

          // Empty line after headers means body starts
          if (!trimmed) {
            // ENHANCED: Only transition to body if method allows it
            if (!HttpParser.METHODS_WITHOUT_BODY.has(currentRequest!.method as HttpMethod)) {
              currentState = ParserState.READING_BODY;
            }
            continue;
          }

          const headerResult = this.parseHeader(line, currentLineNum);
          if (!headerResult.success) {
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

        // Read body (everything goes in, including comments and blank lines)
        if (currentState === ParserState.READING_BODY) {
          bodyLines.push(line);
          continue;
        }
      }

      // ENHANCED: Finalize incomplete request at end of file
      if (currentRequest && currentRequest.method) {
        this.finalizeRequest(currentRequest, bodyLines);
        requests.push(currentRequest as ParsedRequest);
      }

      // Assign IDs to requests
      requests.forEach((req, idx) => {
        req.id = `req-${idx + 1}`;
      });

      // ENHANCED: Log errors and return partial results
      if (errors.length > 0) {
        logger.error(`Parser encountered ${errors.length} error(s)`);
        errors.forEach((err) => {
          logger.error(`  Line ${err.lineNumber}: ${err.message}`);
        });
      }

      return {
        success: errors.length === 0,
        requests,
        errors,
      };
    } catch (error) {
      logger.error(`Parser error: ${error}`);
      return {
        success: false,
        requests: [],
        errors: [
          {
            message: `Unexpected parser error: ${error}`,
            lineNumber: 0,
          },
        ],
      };
    }
  }

  /**
   * Extract @name from comments above request
   */
  private extractRequestName(lines: string[], currentLineIndex: number): string | undefined {
    // Look at previous lines for # @name or // @name
    for (let i = currentLineIndex - 1; i >= 0; i--) {
      const line = lines[i].trim();

      // Stop at empty line or separator
      if (!line || this.isSeparator(line)) {
        break;
      }

      // Check for @name comment
      if (line.startsWith('#') || line.startsWith('//')) {
        const nameMatch = line.match(/@name\s+([a-zA-Z0-9_]+)/);
        if (nameMatch) {
          return nameMatch[1];
        }
      }
    }

    return undefined;
  }

  /**
   * NEW: Finalize request by trimming trailing blank lines from body
   */
  private finalizeRequest(request: Partial<ParsedRequest>, bodyLines: string[]): void {
    if (bodyLines.length > 0) {
      // Trim trailing empty lines
      while (bodyLines.length > 0 && bodyLines[bodyLines.length - 1].trim() === '') {
        bodyLines.pop();
      }

      if (bodyLines.length > 0) {
        request.body = bodyLines.join('\n');
      }
    }
  }

  /**
   * NEW: Check if line is a comment (supports # and //)
   */
  private isCommentLine(line: string): boolean {
    return line.startsWith('#') || line.startsWith('//');
  }

  /**
   * Helper to check if a line is a separator
   */
  private isSeparator(line: string): boolean {
    return HttpParser.REQUEST_SEPARATORS.test(line);
  }

  /**
   * ENHANCED: Parse request line with inline comment support
   */
  private parseRequestLine(
    line: string,
    lineNumber: number
  ): { success: true; request: Partial<ParsedRequest> } | { success: false; error: ParseError } {
    const trimmed = line.trim();

    // ENHANCED: Remove inline comments (anything after # on request line)
    // But preserve # in URLs (like fragments)
    let cleanLine = trimmed;
    const commentIndex = trimmed.indexOf(' #');
    if (commentIndex !== -1) {
      cleanLine = trimmed.substring(0, commentIndex).trim();
    }

    const parts = cleanLine.split(/\s+/);

    if (parts.length < 2) {
      return {
        success: false,
        error: {
          message: `Invalid request line: expected "METHOD URL", got "${cleanLine}"`,
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
          message: `Invalid HTTP method: "${method}". Must be one of: ${Array.from(
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
          message: `Invalid URL format: "${url}". Must start with http://, https://, or /`,
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
          message: `Invalid header format at line ${lineNumber}: missing colon. Expected "Key: Value"`,
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
          message: `Invalid header at line ${lineNumber}: empty header name`,
          lineNumber,
        },
      };
    }

    return { success: true, key, value };
  }

  /**
   * ENHANCED: More flexible URL validation
   */
  private isValidUrl(url: string): boolean {
    // Allow variable placeholders
    if (url.includes('{{')) {
      return true;
    }

    // Allow relative paths
    if (url.startsWith('/')) {
      return true;
    }

    // Try parsing as absolute URL
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

export const httpParser = new HttpParser();

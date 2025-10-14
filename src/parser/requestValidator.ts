import { ParsedRequest } from './types';
import { logger } from '../utils/logger';

export interface ValidationError {
  message: string;
  suggestion?: string;
}

export class RequestValidator {
  validate(request: ParsedRequest): ValidationError | null {
    // Check headers for duplicates (case-insensitive)
    const headerKeys = Array.from(request.headers.keys()).map((k) => k.toLowerCase());
    const uniqueKeys = new Set(headerKeys);

    if (headerKeys.length !== uniqueKeys.size) {
      return {
        message: 'Duplicate header keys found (headers are case-insensitive)',
        suggestion: 'Remove duplicate headers or combine their values',
      };
    }

    // Check for Content-Length if body exists
    if (request.body && request.body.length > 0) {
      const hasContentLength = Array.from(request.headers.keys()).some(
        (k) => k.toLowerCase() === 'content-length'
      );

      if (!hasContentLength && request.method !== 'GET' && request.method !== 'HEAD') {
        logger.debug(`Request ${request.id} has body but no Content-Length header`);
      }
    }

    // Body not allowed for GET/HEAD
    if ((request.method === 'GET' || request.method === 'HEAD') && request.body) {
      return {
        message: `${request.method} requests should not have a body`,
        suggestion: 'Remove the request body',
      };
    }

    return null;
  }
}

export const requestValidator = new RequestValidator();
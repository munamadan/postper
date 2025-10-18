import { ParsedRequest } from '../parser/types';
import { Environment } from './types';
import { logger } from '../utils/logger';

export class EnvResolver {
  private static readonly VARIABLE_PATTERN = /\{\{(\s*[A-Za-z_][A-Za-z0-9_]*\s*)\}\}/g;
  private static readonly MAX_RESOLUTION_DEPTH = 10;

  resolveRequest(request: ParsedRequest, environment: Environment | null): ParsedRequest {
    if (!environment) {
      logger.debug('No environment available for variable resolution');
      return request;
    }

    logger.debug(`Resolving variables for request ${request.id}`);

    // Resolve URL
    const resolvedUrl = this.resolveString(request.url, environment);

    // Resolve headers
    const resolvedHeaders = new Map<string, string>();
    for (const [key, value] of request.headers) {
      const resolvedValue = this.resolveString(value, environment);
      resolvedHeaders.set(key, resolvedValue);
    }

    // Resolve body
    const resolvedBody = request.body 
      ? this.resolveString(request.body, environment)
      : undefined;

    return {
      ...request,
      url: resolvedUrl,
      headers: resolvedHeaders,
      body: resolvedBody,
    };
  }

  private resolveString(text: string, environment: Environment): string {
    let resolved = text;
    let depth = 0;

    while (depth < EnvResolver.MAX_RESOLUTION_DEPTH) {
      const variables = this.extractVariables(resolved);
      
      if (variables.length === 0) {
        break;
      }

      let changed = false;

      for (const varName of variables) {
        const value = environment.variables.get(varName);
        
        if (value === undefined) {
          throw new Error(`Variable "${varName}" not found in environment "${environment.name}"`);
        }

        // Check if this variable references itself (direct circular ref)
        if (value.includes(`{{${varName}}}`)) {
          throw new Error(`Circular reference detected: ${varName}`);
        }

        // Replace variable with value
        const pattern = new RegExp(`\\{\\{\\s*${this.escapeRegex(varName)}\\s*\\}\\}`, 'g');
        const newResolved = resolved.replace(pattern, value);
        
        if (newResolved !== resolved) {
          changed = true;
          resolved = newResolved;
        }
      }

      if (!changed) {
        break;
      }

      depth++;
    }

    if (depth >= EnvResolver.MAX_RESOLUTION_DEPTH) {
      throw new Error('Variable resolution exceeded maximum depth (possible circular reference)');
    }

    return resolved;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private extractVariables(text: string): string[] {
    const variables: string[] = [];
    const matches = text.matchAll(EnvResolver.VARIABLE_PATTERN);

    for (const match of matches) {
      const varName = match[1].trim();
      if (!variables.includes(varName)) {
        variables.push(varName);
      }
    }

    return variables;
  }

  validateVariables(text: string, environment: Environment | null): string[] {
    const variables = this.extractVariables(text);
    const missing: string[] = [];

    for (const varName of variables) {
      if (!environment || !environment.variables.has(varName)) {
        missing.push(varName);
      }
    }

    return missing;
  }
}

export const envResolver = new EnvResolver();
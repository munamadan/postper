import { ParsedRequest } from '../parser/types';
import { Environment } from './types';
import { logger } from '../utils/logger';
import { chainResolver } from './chainResolver';
import { responseChainManager } from '../storage/responseChainManager';

export class EnvResolver {
  private static readonly VARIABLE_PATTERN = /\{\{(\s*[A-Za-z_][A-Za-z0-9_]*\s*)\}\}/g;
  private static readonly MAX_RESOLUTION_DEPTH = 10;

  private currentEnvironment: Environment | null = null;

  setEnvironment(env: Environment | null) {
    this.currentEnvironment = env;
  }

  /**
   * New unified resolve method — resolves chain variables first, then environment variables.
   */
  resolve(request: ParsedRequest): ParsedRequest {
    try {
      // --- Step 1: Resolve chain variables ---
      const chainContext = responseChainManager.getContext();

      const resolvedUrl = chainResolver.resolve(request.url, chainContext);

      const resolvedHeaders = new Map<string, string>();
      request.headers.forEach((value, key) => {
        const resolvedValue = chainResolver.resolve(value, chainContext);
        resolvedHeaders.set(key, resolvedValue);
      });

      const resolvedBody = request.body
        ? chainResolver.resolve(request.body, chainContext)
        : undefined;

      // --- Step 2: Resolve environment variables ---
      const envResolvedUrl = this.resolveVariables(resolvedUrl);

      const finalHeaders = new Map<string, string>();
      resolvedHeaders.forEach((value, key) => {
        const finalValue = this.resolveVariables(value);
        finalHeaders.set(key, finalValue);
      });

      const finalBody = resolvedBody ? this.resolveVariables(resolvedBody) : undefined;

      return {
        ...request,
        url: envResolvedUrl,
        headers: finalHeaders,
        body: finalBody,
      };
    } catch (error) {
      logger.error(`Variable resolution error: ${error}`);
      throw new Error(`Failed to resolve variables: ${error}`);
    }
  }

  /**
   * Resolve environment variables in a string recursively
   */
  private resolveVariables(text: string): string {
    if (!this.currentEnvironment) return text;

    let resolved = text;
    let depth = 0;

    while (depth < EnvResolver.MAX_RESOLUTION_DEPTH) {
      const variables = this.extractVariables(resolved);

      if (variables.length === 0) break;

      let changed = false;

      for (const varName of variables) {
        const value = this.currentEnvironment.variables.get(varName);

        if (value === undefined) {
          throw new Error(
            `Variable "${varName}" not found in environment "${this.currentEnvironment.name}"`
          );
        }

        if (value.includes(`{{${varName}}}`)) {
          throw new Error(`Circular reference detected: ${varName}`);
        }

        const pattern = new RegExp(`\\{\\{\\s*${this.escapeRegex(varName)}\\s*\\}\\}`, 'g');
        const newResolved = resolved.replace(pattern, value);

        if (newResolved !== resolved) {
          changed = true;
          resolved = newResolved;
        }
      }

      if (!changed) break;
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

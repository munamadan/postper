import { ParseEnvironmentResult } from './types';
import { logger } from '../utils/logger';

export class EnvParser {
  parse(content: string, filePath?: string): ParseEnvironmentResult {
    const variables = new Map<string, string>();
    const errors: Array<{ line: number; message: string }> = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Skip empty lines and comments
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Parse key=value
      const equalIndex = line.indexOf('=');
      if (equalIndex === -1) {
        errors.push({
          line: lineNumber,
          message: `Invalid format: expected KEY=VALUE, got "${line}"`,
        });
        continue;
      }

      const key = line.substring(0, equalIndex).trim();
      let value = line.substring(equalIndex + 1).trim();

      // Validate key
      if (!key || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
        errors.push({
          line: lineNumber,
          message: `Invalid key: "${key}". Keys must start with letter/underscore and contain only alphanumeric/underscore characters.`,
        });
        continue;
      }

      // Handle quoted values
      value = this.unquoteValue(value);

      // Check for duplicate variables
      if (variables.has(key)) {
        logger.warn(
          `Duplicate variable "${key}" in ${filePath || 'environment'}. Last value will be used.`
        );
      }

      variables.set(key, value);
      logger.debug(`Parsed env variable: ${key}=${value}`);
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    const name = filePath ? this.getEnvironmentName(filePath) : 'default';

    return {
      success: true,
      environment: {
        name,
        variables,
        filePath,
      },
    };
  }

  private unquoteValue(value: string): string {
    // Handle double quotes
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }

    // Handle single quotes
    if (value.startsWith("'") && value.endsWith("'")) {
      return value.slice(1, -1);
    }

    return value;
  }

  private getEnvironmentName(filePath: string): string {
    // Extract name from file path
    // e.g., ".env.production" -> "production"
    // e.g., ".env" -> "default"
    const filename = filePath.split(/[/\\]/).pop() || '.env';

    if (filename === '.env') {
      return 'default';
    }

    const parts = filename.split('.');
    return parts[parts.length - 1] || 'default';
  }
}

export const envParser = new EnvParser();

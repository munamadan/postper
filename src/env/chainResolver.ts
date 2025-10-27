import { logger } from '../utils/logger';
import { RequestChainContext } from '../types/requestChain';

/**
 * Resolve request chain variables like {{login.response.body.token}}
 */
export class ChainResolver {
  /**
   * Resolve chain variables in text
   */
  resolve(text: string, context: RequestChainContext): string {
    if (!text) return text;

    // Match {{requestName.response.path}}
    const chainVarPattern =
      /\{\{([a-zA-Z0-9_]+)\.response\.(body|headers|status)([\.\[a-zA-Z0-9_\]]+)?\}\}/g;

    let resolved = text;
    let match;

    while ((match = chainVarPattern.exec(text)) !== null) {
      const fullMatch = match[0];
      const requestName = match[1];
      const section = match[2]; // body, headers, or status
      const path = match[3] ? (match[3].startsWith('.') ? match[3].substring(1) : match[3]) : '';

      const value = this.resolveChainVariable(requestName, section, path, context);

      if (value !== undefined) {
        resolved = resolved.replace(fullMatch, String(value));
        logger.info(`Resolved chain variable: ${fullMatch} -> ${value}`);
      } else {
        logger.warn(`Chain variable not found: ${fullMatch}`);
      }
    }

    return resolved;
  }

  /**
   * Resolve a single chain variable
   */
  private resolveChainVariable(
    requestName: string,
    section: string,
    path: string,
    context: RequestChainContext
  ): any {
    const savedResponse = context.responses.get(requestName);

    if (!savedResponse) {
      logger.error(`No saved response found with name: ${requestName}`);
      return undefined;
    }

    // Get the section
    let sectionData: any;
    if (section === 'body') {
      sectionData = savedResponse.body;
    } else if (section === 'headers') {
      sectionData = Object.fromEntries(savedResponse.headers);
    } else if (section === 'status') {
      return savedResponse.status;
    } else {
      return undefined;
    }

    // If no path, return the whole section
    if (!path) {
      return typeof sectionData === 'object' ? JSON.stringify(sectionData) : sectionData;
    }

    // Navigate the path
    return this.getNestedValue(sectionData, path);
  }

  /**
   * Get nested value from object using dot notation or array indices
   */
  private getNestedValue(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }

      // Handle direct array index: [0]
      if (part.match(/^\[(\d+)\]$/)) {
        const index = parseInt(part.match(/^\[(\d+)\]$/)![1], 10);
        if (Array.isArray(current)) {
          current = current[index];
        } else {
          return undefined;
        }
      }
      // Handle property with array index: items[0]
      else if (part.match(/^([a-zA-Z0-9_]+)\[(\d+)\]$/)) {
        const arrayMatch = part.match(/^([a-zA-Z0-9_]+)\[(\d+)\]$/)!;
        const key = arrayMatch[1];
        const index = parseInt(arrayMatch[2], 10);
        current = current[key];
        if (Array.isArray(current)) {
          current = current[index];
        } else {
          return undefined;
        }
      }
      // Handle regular property
      else {
        current = current[part];
      }
    }

    return current;
  }
}

export const chainResolver = new ChainResolver();

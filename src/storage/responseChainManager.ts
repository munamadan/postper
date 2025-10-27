import { logger } from '../utils/logger';
import { SavedResponse, RequestChainContext } from '../types/requestChain';
import { HttpResponse } from '../client/types';

/**
 * Manage saved responses for request chaining
 */
export class ResponseChainManager {
  private context: RequestChainContext;

  constructor() {
    this.context = {
      responses: new Map(),
    };
  }

  /**
   * Save a response with a name for later use
   */
  saveResponse(name: string, response: HttpResponse): void {
    try {
      // Try to parse body as JSON
      let parsedBody: any;
      const bodyStr = response.body.toString('utf-8');

      try {
        parsedBody = JSON.parse(bodyStr);
      } catch {
        // Not JSON, keep as string
        parsedBody = bodyStr;
      }

      const saved: SavedResponse = {
        name,
        status: response.statusCode,
        headers: new Map(response.headers),
        body: parsedBody,
        rawBody: response.body,
        timestamp: Date.now(),
      };

      this.context.responses.set(name, saved);
      logger.info(`Saved response: ${name} (status: ${response.statusCode})`);
    } catch (error) {
      logger.error(`Failed to save response ${name}: ${error}`);
    }
  }

  /**
   * Get a saved response by name
   */
  getResponse(name: string): SavedResponse | undefined {
    return this.context.responses.get(name);
  }

  /**
   * Get all saved responses
   */
  getAllResponses(): Map<string, SavedResponse> {
    return this.context.responses;
  }

  /**
   * Clear all saved responses
   */
  clearAll(): void {
    this.context.responses.clear();
    logger.info('Cleared all saved responses');
  }

  /**
   * Clear a specific saved response
   */
  clear(name: string): boolean {
    const deleted = this.context.responses.delete(name);
    if (deleted) {
      logger.info(`Cleared saved response: ${name}`);
    }
    return deleted;
  }

  /**
   * Get context for variable resolution
   */
  getContext(): RequestChainContext {
    return this.context;
  }
}

export const responseChainManager = new ResponseChainManager();

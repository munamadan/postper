import * as vscode from 'vscode';
import { logger } from '../utils/logger';
import { SavedResponse, RequestChainContext } from '../types/requestChain';
import { HttpResponse } from '../client/types';

/**
 * Manage saved responses for request chaining
 */
export class ResponseChainManager {
  private context: RequestChainContext;
  private readonly storageKey = 'postper.responseChain';
  private readonly vscodeContext: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.vscodeContext = context;
    this.context = {
      responses: new Map(),
    };
    this.loadFromStorage();
  }

  /**
   * Load saved responses from persistent storage
   */
  private loadFromStorage(): void {
    try {
      const stored = this.vscodeContext.globalState.get<SavedResponse[]>(this.storageKey);
      if (stored) {
        this.context.responses = new Map(stored.map((r) => [r.name, r]));
        logger.info(`Loaded ${stored.length} saved responses from storage`);
      }
    } catch (error) {
      logger.error(`Failed to load responses from storage: ${error}`);
    }
  }

  /**
   * Save responses to persistent storage
   */
  private saveToStorage(): void {
    try {
      const responses = Array.from(this.context.responses.values());
      this.vscodeContext.globalState.update(this.storageKey, responses);
      logger.info(`Saved ${responses.length} responses to storage`);
    } catch (error) {
      logger.error(`Failed to save responses to storage: ${error}`);
    }
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
      this.saveToStorage();
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
    this.saveToStorage();
    logger.info('Cleared all saved responses');
  }

  /**
   * Clear a specific saved response
   */
  clear(name: string): boolean {
    const deleted = this.context.responses.delete(name);
    if (deleted) {
      this.saveToStorage();
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

import { HttpRequest } from '../types/common';
import { HttpResponse } from './types';
import { httpClient } from './httpClient';
import { logger } from '../utils/logger';

export class RequestManager {
  private activeRequests = new Map<string, AbortController>();

  async sendRequest(request: HttpRequest): Promise<HttpResponse> {
    try {
      const abortController = new AbortController();
      this.activeRequests.set(request.id, abortController);

      logger.info(`Executing request ${request.id}`);
      const response = await httpClient.send(request);

      this.activeRequests.delete(request.id);
      return response;
    } catch (error) {
      this.activeRequests.delete(request.id);
      throw error;
    }
  }

  cancelRequest(requestId: string): boolean {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
      logger.info(`Request ${requestId} cancelled`);
      return true;
    }
    return false;
  }

  getActiveRequestCount(): number {
    return this.activeRequests.size;
  }

  hasActiveRequest(requestId: string): boolean {
    return this.activeRequests.has(requestId);
  }
}

export const requestManager = new RequestManager();

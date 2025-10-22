import axios, { AxiosInstance, AxiosError } from 'axios';
import { HttpRequest } from '../types/common';
import { HttpResponse } from './types';
import { errorCategorizer } from './errorCategorizer';
import { logger } from '../utils/logger';

export class HttpClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: () => true, // Don't throw on any status
    });
  }

  async send(request: HttpRequest): Promise<HttpResponse> {
    const startTime = Date.now();

    try {
      logger.info(`Sending ${request.method} request to ${request.url}`);

      const response = await this.axiosInstance.request({
        method: request.method.toLowerCase() as any,
        url: request.url,
        headers: Object.fromEntries(request.headers),
        data: request.body || undefined,
        timeout: request.timeout,
      });

      const totalTime = Date.now() - startTime;

      const responseHeaders = new Map(Object.entries(response.headers));

      const bodySize = Buffer.byteLength(JSON.stringify(response.data));
      if (bodySize > 1000000) {
        // 1MB
        logger.warn(`Response body exceeds 1MB (${bodySize} bytes), will be truncated for display`);
      }

      logger.info(
        `Response: ${response.status} ${response.statusText} (${totalTime}ms, ${bodySize} bytes)`
      );

      return {
        requestId: request.id,
        statusCode: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: Buffer.from(
          typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
        ),
        timings: { total: totalTime },
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;

      logger.error(`Request failed: ${error}`);

      const errorDetails = errorCategorizer.categorize(error as AxiosError | Error);

      return {
        requestId: request.id,
        statusCode: 0,
        statusText: 'Error',
        headers: new Map(),
        body: Buffer.from(''),
        timings: { total: totalTime },
        error: errorDetails,
      };
    }
  }
}

export const httpClient = new HttpClient();

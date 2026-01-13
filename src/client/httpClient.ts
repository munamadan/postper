import axios, { AxiosInstance, AxiosError } from 'axios';
import path from 'path';
import FormData from 'form-data';
import { HttpRequest } from '../types/common';
import { HttpResponse } from './types';
import { errorCategorizer } from './errorCategorizer';
import { logger } from '../utils/logger';
import { MultipartParser } from '../parser/multipartParser';
import { fileReader } from '../utils/fileReader';
import {
  DEFAULT_REQUEST_TIMEOUT,
  DEFAULT_MAX_REDIRECTS,
  RESPONSE_BODY_TRUNCATION_THRESHOLD,
} from '../utils/constants';

export class HttpClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: DEFAULT_REQUEST_TIMEOUT,
      maxRedirects: DEFAULT_MAX_REDIRECTS,
      validateStatus: () => true,
    });
  }

  private async buildFormData(
    body: string,
    contentType: string,
    workspaceRoot?: string
  ): Promise<FormData | null> {
    try {
      const boundary = MultipartParser.extractBoundary(contentType);
      if (!boundary) {
        logger.error('No boundary found in Content-Type header');
        return null;
      }

      const parseResult = new MultipartParser().parse(body, boundary);
      if (!parseResult.success || !parseResult.multipart) {
        logger.error(`Multipart parsing failed: ${parseResult.error}`);
        return null;
      }

      const formData = new FormData();

      for (const part of parseResult.multipart.parts) {
        if (part.filePath) {
          const fileResult = await fileReader.readFile(part.filePath, workspaceRoot);
          if (!fileResult.success || !fileResult.data) {
            logger.error(`Failed to read file: ${fileResult.error}`);
            continue;
          }

          formData.append(part.name, fileResult.data, {
            filename: part.filename || path.basename(part.filePath),
            contentType: part.contentType || fileResult.contentType,
          });

          logger.info(`Added file to form: ${part.name} = ${part.filePath}`);
        } else if (part.value !== undefined) {
          formData.append(part.name, part.value);
          logger.info(`Added field to form: ${part.name} = ${part.value}`);
        }
      }

      return formData;
    } catch (error) {
      logger.error(`Failed to build FormData: ${error}`);
      return null;
    }
  }

  async send(request: HttpRequest, signal?: AbortSignal): Promise<HttpResponse> {
    const startTime = Date.now();

    try {
      logger.info(`Sending ${request.method} request to ${request.url}`);

      let dataToSend: any = request.body || undefined;
      const contentType = request.headers.get('Content-Type') || '';

      if (contentType.includes('multipart/form-data') && request.body) {
        logger.info(`Handling multipart request, workspaceRoot: ${request.workspaceRoot}`);
        const formData = await this.buildFormData(request.body, contentType, request.workspaceRoot);
        if (formData) {
          dataToSend = formData;
        }
      }

      const response = await this.axiosInstance.request({
        method: request.method.toLowerCase() as any,
        url: request.url,
        headers: Object.fromEntries(request.headers),
        data: dataToSend,
        timeout: request.timeout,
        signal,
      });

      const totalTime = Date.now() - startTime;
      const responseHeaders = new Map(Object.entries(response.headers));

      const bodySize = Buffer.byteLength(
        typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
      );

      if (bodySize > RESPONSE_BODY_TRUNCATION_THRESHOLD) {
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

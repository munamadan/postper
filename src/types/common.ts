export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface HttpRequest {
  readonly id: string;
  readonly method: HttpMethod;
  readonly url: string;
  readonly headers: ReadonlyMap<string, string>;
  readonly body?: string;
  readonly timeout: number;
  readonly metadata: RequestMetadata;
  readonly workspaceRoot?: string;
}

export interface RequestMetadata {
  readonly fileUri: string;
  readonly lineNumber: number;
  readonly timestamp: number;
}

export interface HttpResponse {
  requestId: string;
  statusCode: number;
  statusText: string;
  headers: ReadonlyMap<string, string>;
  body: Buffer;
  timings: ResponseTimings;
  error?: ErrorDetails;
}

export interface ResponseTimings {
  total: number;
}

export interface ErrorDetails {
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
}

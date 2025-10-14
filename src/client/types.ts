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
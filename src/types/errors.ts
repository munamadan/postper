export class HttpClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'HttpClientError';
  }
}

export class ParseError extends Error {
  constructor(
    message: string,
    public lineNumber: number,
    public column?: number
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
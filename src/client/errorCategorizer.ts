import { AxiosError } from 'axios';
import { ErrorDetails } from './types';

export class ErrorCategorizer {
  categorize(error: AxiosError | Error): ErrorDetails {
    if (error instanceof AxiosError) {
      return this.categorizeAxiosError(error);
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      userMessage: 'An unexpected error occurred',
      retryable: false,
    };
  }

  private categorizeAxiosError(error: AxiosError): ErrorDetails {
    const code = error.code || 'UNKNOWN';

    switch (code) {
      case 'ECONNABORTED':
        return {
          code,
          message: error.message,
          userMessage: 'Request timed out. Try increasing the timeout value or check network.',
          retryable: true,
        };

      case 'ENOTFOUND':
      case 'EAI_AGAIN':
        return {
          code,
          message: error.message,
          userMessage:
            'Could not resolve hostname. Check URL and network connection.',
          retryable: true,
        };

      case 'ECONNREFUSED':
        return {
          code,
          message: error.message,
          userMessage: 'Connection refused. Is the server running on that address?',
          retryable: true,
        };

      case 'EPROTO':
      case 'ERR_TLS_CERT_AUTH_FAILURE':
        return {
          code,
          message: error.message,
          userMessage: 'SSL/TLS error. Check certificate or disable certificate validation.',
          retryable: false,
        };

      case 'ERR_HTTP_REQUEST_TIMEOUT':
        return {
          code,
          message: error.message,
          userMessage: 'Request timeout. Server not responding.',
          retryable: true,
        };

      default:
        return {
          code,
          message: error.message,
          userMessage: `Error: ${error.message}`,
          retryable: false,
        };
    }
  }
}

export const errorCategorizer = new ErrorCategorizer();
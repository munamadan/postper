/**
 * Centralized constants for the POSTPER extension
 */

// Request timeout in milliseconds (30 seconds)
export const DEFAULT_REQUEST_TIMEOUT = 30000;

// Maximum number of HTTP redirects
export const DEFAULT_MAX_REDIRECTS = 5;

// Maximum body size for display truncation (1MB)
export const MAX_BODY_SIZE_FOR_DISPLAY = 1000000;

// Maximum environment variable resolution depth
export const MAX_ENV_RESOLUTION_DEPTH = 10;

// Status bar priority (right side, lower number = more to the left)
export const STATUS_BAR_ALIGNMENT = 100;

// Error display duration in status bar (5 seconds)
export const ERROR_DISPLAY_DURATION = 5000;

// Response body truncation warning threshold
export const RESPONSE_BODY_TRUNCATION_THRESHOLD = 1000000;

// File patterns for HTTP files
export const HTTP_FILE_PATTERN = '**/*.{http,rest}';

// Response panel view settings
export const WEBVIEW_OPTIONS = {
  enableScripts: true,
  retainContextWhenHidden: true,
} as const;

// HTTP methods without body
export const METHODS_WITHOUT_BODY = new Set(['GET', 'HEAD'] as const);

import * as vscode from 'vscode';
import { HttpResponse } from '../types/common';
import { logger } from '../utils/logger';
import { responseFormatter } from '../utils/formatter';
import { WEBVIEW_OPTIONS } from '../utils/constants';

export class ResponsePanel {
  private panel: vscode.WebviewPanel | undefined;
  private readonly viewType = 'httpClientResponse';
  private readonly viewTitle = 'HTTP Response';
  private currentRequestId: string | null = null;

  show(column: vscode.ViewColumn = vscode.ViewColumn.Beside): void {
    if (this.panel) {
      this.panel.reveal(column);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      this.viewType,
      this.viewTitle,
      column,
      WEBVIEW_OPTIONS
    );

    this.panel.onDidDispose(() => {
      this.panel = undefined;
      this.currentRequestId = null;
      logger.debug('Response panel disposed');
    });

    this.setPlaceholder();
  }

  displayResponse(response: HttpResponse): void {
    if (this.currentRequestId && this.currentRequestId !== response.requestId) {
      logger.info(
        `Ignoring stale response ${response.requestId}, expecting ${this.currentRequestId}`
      );
      return;
    }

    if (!this.panel) {
      this.show();
    }

    this.currentRequestId = response.requestId;
    const html = this.getResponseHtml(response);
    this.panel!.webview.html = html;
    this.panel!.reveal();
  }

  displayLoading(requestId: string): void {
    if (!this.panel) {
      this.show();
    }

    this.currentRequestId = requestId;
    this.panel!.webview.html = this.getLoadingHtml();
  }

  displayError(message: string, requestId?: string): void {
    if (requestId) {
      this.currentRequestId = requestId;
    }

    if (!this.panel) {
      this.show();
    }

    this.panel!.webview.html = this.getErrorHtml(message);
  }

  private setPlaceholder(): void {
    this.panel!.webview.html = this.getPlaceholderHtml();
  }

  private getPlaceholderHtml(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${this.getBaseStyles()}</style>
        </head>
        <body>
          <div class="placeholder">
            <div class="icon">Network</div>
            <h2>HTTP Client</h2>
            <p>No response yet</p>
            <p class="hint">Send a request to see response here</p>
          </div>
        </body>
      </html>
    `;
  }

  private getLoadingHtml(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${this.getBaseStyles()}</style>
        </head>
        <body>
          <div class="loading-container">
            <div class="spinner"></div>
            <p>Sending request...</p>
          </div>
        </body>
      </html>
    `;
  }

  private getErrorHtml(message: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${this.getBaseStyles()}</style>
        </head>
        <body>
          <div class="error-container">
            <div class="error-icon">Error</div>
            <h3>Error</h3>
            <p class="error-message">${this.escapeHtml(message)}</p>
          </div>
        </body>
      </html>
    `;
  }

  private getResponseHtml(response: HttpResponse): string {
    const statusColor = this.getStatusColor(response.statusCode);
    const contentType = response.headers.get('content-type') || 'text/plain';
    const bodyText = response.body.toString('utf-8');

    const formatType = responseFormatter.detectContentType(contentType);
    const formattedBody = responseFormatter.format(bodyText, formatType);
    const { text: displayBody, truncated } = responseFormatter.truncate(formattedBody);

    const headers = Array.from(response.headers.entries())
      .map(
        ([key, value]) => `
        <tr>
          <td class="header-key">${this.escapeHtml(key)}</td>
          <td class="header-value">${this.escapeHtml(value)}</td>
        </tr>
      `
      )
      .join('');

    const truncationWarning = truncated
      ? '<div class="warning">Response body truncated (too large to display)</div>'
      : '';

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${this.getBaseStyles()}</style>
          <script>${this.getScript()}</script>
        </head>
        <body>
          <div class="response-container">
            <div class="status-line" style="border-left: 4px solid ${statusColor};">
              <span class="status-code" style="color: ${statusColor};">
                ${response.statusCode}
              </span>
              <span class="status-text">${this.escapeHtml(response.statusText)}</span>
              <span class="timing">${response.timings.total}ms</span>
            </div>

            ${response.error ? this.getErrorSection(response.error) : ''}

            <div class="section">
              <div class="section-header">
                <h3>Headers</h3>
                <button onclick="copyHeaders()" class="copy-btn">Copy</button>
              </div>
              <table class="headers-table" id="headers">
                ${headers}
              </table>
            </div>

            <div class="section">
              <div class="section-header">
                <h3>Body</h3>
                <div class="body-controls">
                  <span class="body-size">${response.body.length} bytes</span>
                  <span class="body-type">${formatType.toUpperCase()}</span>
                  <button onclick="copyBody()" class="copy-btn">Copy</button>
                </div>
              </div>
              ${truncationWarning}
              <pre class="body-content" id="body">${this.escapeHtml(displayBody)}</pre>
            </div>

            <div class="section timing-section">
              <h3>Timing</h3>
              <div class="timing-item">
                <span class="timing-label">Total:</span>
                <span class="timing-value">${response.timings.total}ms</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getErrorSection(error: any): string {
    return `
      <div class="error-section">
        <div class="error-title">Request Failed</div>
        <div class="error-details">
          <div><strong>Code:</strong> ${this.escapeHtml(error.code)}</div>
          <div><strong>Message:</strong> ${this.escapeHtml(error.userMessage)}</div>
          ${error.retryable ? '<div class="retry-hint">This error might be temporary. Try again.</div>' : ''}
        </div>
      </div>
    `;
  }

  private getStatusColor(statusCode: number): string {
    if (statusCode < 200) {
      return '#2196F3';
    }
    if (statusCode < 300) {
      return '#4CAF50';
    }
    if (statusCode < 400) {
      return '#2196F3';
    }
    if (statusCode < 500) {
      return '#FF9800';
    }
    return '#F44336';
  }

  private getBaseStyles(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: var(--vscode-font-family);
        color: var(--vscode-foreground);
        background-color: var(--vscode-editor-background);
        padding: 16px;
        line-height: 1.6;
      }

      .placeholder, .loading-container, .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 80vh;
        text-align: center;
      }

      .icon, .error-icon {
        font-size: 64px;
        margin-bottom: 20px;
      }

      .hint {
        color: var(--vscode-descriptionForeground);
        font-size: 14px;
      }

      .spinner {
        border: 4px solid var(--vscode-textBlockQuote-background);
        border-top: 4px solid var(--vscode-focusBorder);
        border-radius: 50%;
        width: 48px;
        height: 48px;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .response-container {
        max-width: 1200px;
      }

      .status-line {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background-color: var(--vscode-textBlockQuote-background);
        border-radius: 4px;
        margin-bottom: 20px;
        font-size: 16px;
      }

      .status-code {
        font-weight: bold;
        font-size: 20px;
      }

      .status-text {
        flex: 1;
        color: var(--vscode-descriptionForeground);
      }

      .timing {
        color: var(--vscode-descriptionForeground);
        font-size: 14px;
      }

      .error-section {
        background-color: var(--vscode-inputValidation-errorBackground);
        border: 1px solid var(--vscode-inputValidation-errorBorder);
        border-radius: 4px;
        padding: 16px;
        margin-bottom: 20px;
      }

      .error-title {
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 8px;
      }

      .error-details {
        font-size: 14px;
        line-height: 1.8;
      }

      .retry-hint {
        margin-top: 8px;
        color: var(--vscode-descriptionForeground);
        font-style: italic;
      }

      .warning {
        background-color: var(--vscode-inputValidation-warningBackground);
        border: 1px solid var(--vscode-inputValidation-warningBorder);
        padding: 8px 12px;
        border-radius: 4px;
        margin-bottom: 12px;
        font-size: 14px;
      }

      .section {
        margin-bottom: 24px;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      h3 {
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--vscode-textPreformat-foreground);
        letter-spacing: 0.5px;
      }

      .body-controls {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .body-size, .body-type {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
      }

      .copy-btn {
        background-color: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        border: none;
        padding: 4px 12px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
        transition: background-color 0.2s;
      }

      .copy-btn:hover {
        background-color: var(--vscode-button-secondaryHoverBackground);
      }

      .headers-table {
        width: 100%;
        border-collapse: collapse;
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
      }

      .headers-table tr {
        border-bottom: 1px solid var(--vscode-panel-border);
      }

      .headers-table tr:last-child {
        border-bottom: none;
      }

      .header-key {
        padding: 8px 12px;
        font-weight: 500;
        color: var(--vscode-symbolIcon-keywordForeground);
        width: 30%;
      }

      .header-value {
        padding: 8px 12px;
        word-break: break-all;
        font-family: var(--vscode-editor-font-family);
        font-size: 13px;
      }

      .body-content {
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        padding: 16px;
        overflow-x: auto;
        max-height: 600px;
        overflow-y: auto;
        font-family: var(--vscode-editor-font-family);
        font-size: 13px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      .timing-section {
        background-color: var(--vscode-textBlockQuote-background);
        padding: 12px;
        border-radius: 4px;
      }

      .timing-item {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
      }

      .timing-label {
        color: var(--vscode-descriptionForeground);
      }

      .timing-value {
        font-weight: 600;
      }

      .error-message {
        margin-top: 8px;
        padding: 12px;
        background-color: var(--vscode-editor-background);
        border-radius: 4px;
        font-family: var(--vscode-editor-font-family);
      }
    `;
  }

  private getScript(): string {
    return `
      function copyHeaders() {
        const table = document.getElementById('headers');
        const rows = table.getElementsByTagName('tr');
        let text = '';
        for (let row of rows) {
          const cells = row.getElementsByTagName('td');
          if (cells.length === 2) {
            text += cells[0].textContent + ': ' + cells[1].textContent + '\\n';
          }
        }
        navigator.clipboard.writeText(text);
      }

      function copyBody() {
        const body = document.getElementById('body');
        navigator.clipboard.writeText(body.textContent);
      }
    `;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  dispose(): void {
    if (this.panel) {
      this.panel.dispose();
      this.panel = undefined;
    }
  }
}

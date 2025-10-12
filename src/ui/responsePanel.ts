import * as vscode from 'vscode';
import { HttpResponse } from '../types/common';
import { logger } from '../utils/logger';

export class ResponsePanel {
  private panel: vscode.WebviewPanel | undefined;
  private readonly viewType = 'httpClientResponse';
  private readonly viewTitle = 'HTTP Response';

  show(column: vscode.ViewColumn = vscode.ViewColumn.Beside): void {
    if (this.panel) {
      this.panel.reveal(column);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      this.viewType,
      this.viewTitle,
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    this.panel.onDidDispose(() => {
      this.panel = undefined;
      logger.debug('Response panel disposed');
    });

    this.setPlaceholder();
  }

  displayResponse(response: HttpResponse): void {
    if (!this.panel) {
      this.show();
    }

    // Placeholder HTML - will be replaced in Phase 3
    const html = this.getResponseHtml(response);
    this.panel!.webview.html = html;
    this.panel!.reveal();
  }

  displayLoading(): void {
    if (!this.panel) {
      this.show();
    }

    this.panel!.webview.html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              font-family: var(--vscode-font-family);
              color: var(--vscode-foreground);
            }
            .spinner {
              border: 4px solid var(--vscode-textBlockQuote-background);
              border-top: 4px solid var(--vscode-accentForeground);
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="spinner"></div>
        </body>
      </html>
    `;
  }

  displayError(message: string): void {
    if (!this.panel) {
      this.show();
    }

    this.panel!.webview.html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              padding: 20px;
              font-family: var(--vscode-font-family);
              color: var(--vscode-foreground);
            }
            .error {
              background-color: var(--vscode-inputValidation-errorBackground);
              border: 1px solid var(--vscode-inputValidation-errorBorder);
              color: var(--vscode-inputValidation-errorForeground);
              padding: 12px;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="error">
            <strong>Error:</strong> ${this.escapeHtml(message)}
          </div>
        </body>
      </html>
    `;
  }

  private setPlaceholder(): void {
    this.panel!.webview.html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              font-family: var(--vscode-font-family);
              color: var(--vscode-descriptionForeground);
            }
            .placeholder {
              text-align: center;
            }
            .icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="placeholder">
            <div class="icon">🌐</div>
            <p>HTTP Client: No response yet</p>
            <p>Send a request to see the response here</p>
          </div>
        </body>
      </html>
    `;
  }

  private getResponseHtml(response: HttpResponse): string {
    const statusColor =
      response.statusCode < 300
        ? '#4CAF50'
        : response.statusCode < 400
          ? '#2196F3'
          : response.statusCode < 500
            ? '#FF9800'
            : '#F44336';

    const headers = Array.from(response.headers.entries())
      .map(
        ([key, value]) => `
      <div class="header-row">
        <span class="header-key">${this.escapeHtml(key)}:</span>
        <span class="header-value">${this.escapeHtml(value)}</span>
      </div>
    `
      )
      .join('');

    const bodyText = response.body.toString('utf-8');
    const bodyDisplay = bodyText.substring(0, 1000); // Truncate for now

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: var(--vscode-font-family);
              color: var(--vscode-foreground);
              padding: 16px;
            }
            .status-line {
              display: flex;
              align-items: center;
              padding: 12px;
              background-color: var(--vscode-textBlockQuote-background);
              border-radius: 4px;
              margin-bottom: 16px;
            }
            .status-code {
              font-weight: bold;
              font-size: 18px;
              color: ${statusColor};
              margin-right: 8px;
            }
            .status-text {
              color: var(--vscode-descriptionForeground);
            }
            .section {
              margin-bottom: 24px;
            }
            .section-title {
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 8px;
              color: var(--vscode-accentForeground);
              text-transform: uppercase;
            }
            .header-row {
              display: grid;
              grid-template-columns: 200px 1fr;
              padding: 8px 0;
              border-bottom: 1px solid var(--vscode-textBlockQuote-background);
            }
            .header-key {
              font-weight: 500;
              color: var(--vscode-accentForeground);
            }
            .header-value {
              color: var(--vscode-foreground);
              word-break: break-all;
            }
            .body {
              background-color: var(--vscode-editor-background);
              border: 1px solid var(--vscode-textBlockQuote-background);
              border-radius: 4px;
              padding: 12px;
              font-family: var(--vscode-editor-font-family);
              font-size: 12px;
              overflow-x: auto;
              max-height: 500px;
              overflow-y: auto;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
          </style>
        </head>
        <body>
          <div class="status-line">
            <div class="status-code">${response.statusCode}</div>
            <div class="status-text">${this.escapeHtml(response.statusText)}</div>
          </div>

          <div class="section">
            <div class="section-title">Headers</div>
            ${headers}
          </div>

          <div class="section">
            <div class="section-title">Body (${response.body.length} bytes)</div>
            <div class="body">${this.escapeHtml(bodyDisplay)}</div>
          </div>

          <div class="section">
            <div class="section-title">Timing</div>
            <div class="header-row">
              <span class="header-key">Total:</span>
              <span class="header-value">${response.timings.total}ms</span>
            </div>
          </div>
        </body>
      </html>
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
    }
  }
}
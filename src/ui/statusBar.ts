import * as vscode from 'vscode';
import { logger } from '../utils/logger';

export class StatusBar {
  private statusBarItem: vscode.StatusBarItem;
  private activeRequestCount = 0;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.name = 'HTTP Client Status';
    this.updateStatus('ready');
    this.statusBarItem.show();
  }

  updateStatus(status: 'ready' | 'sending' | 'error'): void {
    switch (status) {
      case 'ready':
        this.statusBarItem.text = '$(globe) HTTP Client: Ready';
        this.statusBarItem.tooltip = 'HTTP Client is ready';
        this.statusBarItem.color = undefined;
        break;
      case 'sending':
        const count = this.activeRequestCount > 1 ? ` (${this.activeRequestCount})` : '';
        this.statusBarItem.text = `$(sync~spin) HTTP Client: Sending${count}`;
        this.statusBarItem.tooltip = `Sending HTTP request${count}`;
        this.statusBarItem.color = undefined;
        break;
      case 'error':
        this.statusBarItem.text = '$(error) HTTP Client: Error';
        this.statusBarItem.tooltip = 'Error in HTTP request';
        this.statusBarItem.color = new vscode.ThemeColor('errorForeground');
        break;
    }
  }

  setActiveRequestCount(count: number): void {
    this.activeRequestCount = count;
    if (count > 0) {
      this.updateStatus('sending');
    } else {
      this.updateStatus('ready');
    }
  }

  showError(message: string, durationMs: number = 5000): void {
    this.updateStatus('error');
    logger.error(message);
    setTimeout(() => this.updateStatus('ready'), durationMs);
  }

  dispose(): void {
    this.statusBarItem.dispose();
    logger.info('Status bar disposed');
  }
}
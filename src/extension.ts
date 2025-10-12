import * as vscode from 'vscode';
import { logger } from './utils/logger';

export function activate(context: vscode.ExtensionContext) {
  logger.info('HTTP Client extension activating...');

  // Register commands
  const sendRequestCmd = vscode.commands.registerCommand(
    'http-client.sendRequest',
    () => {
      logger.info('Send Request command executed');
      vscode.window.showInformationMessage('HTTP Client: Send Request command received');
    }
  );

  const cancelRequestCmd = vscode.commands.registerCommand(
    'http-client.cancelRequest',
    () => {
      logger.info('Cancel Request command executed');
      vscode.window.showInformationMessage('HTTP Client: Cancel Request command received');
    }
  );

  const copyAsCurlCmd = vscode.commands.registerCommand(
    'http-client.copyAsCurl',
    () => {
      logger.info('Copy as cURL command executed');
      vscode.window.showInformationMessage('HTTP Client: Copy as cURL command received');
    }
  );

  context.subscriptions.push(sendRequestCmd, cancelRequestCmd, copyAsCurlCmd);

  logger.info('HTTP Client extension activated successfully');
  logger.show();
}

export function deactivate() {
  logger.info('HTTP Client extension deactivating');
  logger.dispose();
}
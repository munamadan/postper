import * as vscode from 'vscode';
import { logger } from './utils/logger';
import { FileWatcher } from './utils/fileWatcher';
import { DocumentWatcher } from './utils/documentWatcher';
import { HttpCodeLensProvider } from './ui/codeLensProvider';
import { StatusBar } from './ui/statusBar';
import { ResponsePanel } from './ui/responsePanel';

let codeLensProvider: HttpCodeLensProvider;
let fileWatcher: FileWatcher;
let documentWatcher: DocumentWatcher;
let statusBar: StatusBar;
let responsePanel: ResponsePanel;
let _activeTimeout: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {
  logger.info('HTTP Client extension activating...');
  
  try {
    // Initialize UI components
    statusBar = new StatusBar();
    responsePanel = new ResponsePanel();
    codeLensProvider = new HttpCodeLensProvider();
    fileWatcher = new FileWatcher();
    documentWatcher = new DocumentWatcher();

    // Register CodeLens provider
    const codeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
      [
        { language: 'http', scheme: 'file' },
        { language: 'rest', scheme: 'file' },
      ],
      codeLensProvider
    );

    // Watch for document changes to update CodeLens
    const documentChangeDisposable = documentWatcher.onDidChangeDocument(() => {
      codeLensProvider.notifyDocumentChanged();
    });

    // Setup file watcher
    fileWatcher.startWatching(
      (uri) => logger.info(`New HTTP file created: ${uri.fsPath}`),
      (uri) => {
        logger.debug(`HTTP file changed: ${uri.fsPath}`);
        codeLensProvider.notifyDocumentChanged();
      },
      (uri) => logger.info(`HTTP file deleted: ${uri.fsPath}`)
    );

    const sendRequestCmd = vscode.commands.registerCommand(
      'http-client.sendRequest',
      (uri: vscode.Uri, lineNumber: number) => {
        logger.info(`Send request at line ${lineNumber} in ${uri.fsPath}`);
        
        // Clear any existing timeout
        if (_activeTimeout) {
          clearTimeout(_activeTimeout);
        }
        
        statusBar.setActiveRequestCount(1);
        responsePanel.displayLoading();

        // Simulate request
        _activeTimeout = setTimeout(() => {
          statusBar.setActiveRequestCount(0);
          logger.info('Request completed (placeholder)');
          _activeTimeout = undefined;
        }, 2000);
      }
    );

    const cancelRequestCmd = vscode.commands.registerCommand(
      'http-client.cancelRequest',
      () => {
        logger.info('Cancel request command executed');
        statusBar.setActiveRequestCount(0);
        statusBar.showError('Request cancelled');
      }
    );

    const copyAsCurlCmd = vscode.commands.registerCommand(
      'http-client.copyAsCurl',
      (uri: vscode.Uri, lineNumber: number) => {
        logger.info(`Copy as cURL at line ${lineNumber} in ${uri.fsPath}`);
        vscode.env.clipboard.writeText('curl -X GET https://example.com');
        vscode.window.showInformationMessage('Copied as cURL to clipboard');
      }
    );

    const focusResponseCmd = vscode.commands.registerCommand(
      'http-client.focus',
      () => {
        responsePanel.show();
      }
    );

    // Add all disposables to context
    context.subscriptions.push(
      codeLensProviderDisposable,
      documentChangeDisposable,
      sendRequestCmd,
      cancelRequestCmd,
      copyAsCurlCmd,
      focusResponseCmd,
      statusBar,
      responsePanel,
      fileWatcher,
      documentWatcher,
      codeLensProvider
    );

    logger.info('HTTP Client extension activated successfully');
    logger.show();
  } catch (error) {
    logger.error(`Failed to activate extension: ${error}`);
    throw error;
  }
}

export function deactivate() {
  logger.info('HTTP Client extension deactivating');
}
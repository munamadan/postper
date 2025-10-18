import * as vscode from 'vscode';
import { logger } from './utils/logger';
import { FileWatcher } from './utils/fileWatcher';
import { DocumentWatcher } from './utils/documentWatcher';
import { HttpCodeLensProvider } from './ui/codeLensProvider';
import { StatusBar } from './ui/statusBar';
import { ResponsePanel } from './ui/responsePanel';
import { httpParser } from './parser/httpParser';
import { requestValidator } from './parser/requestValidator';
import { httpClient } from './client/httpClient';
import { HttpRequest } from './types/common';
import { environmentManager } from './storage/environmentManager';
import { envResolver } from './env/envResolver'

let codeLensProvider: HttpCodeLensProvider;
let fileWatcher: FileWatcher;
let documentWatcher: DocumentWatcher;
let statusBar: StatusBar;
let responsePanel: ResponsePanel;

export async function activate(context: vscode.ExtensionContext) {
  logger.info('HTTP Client extension activating...');

  try {
    // Initialize UI components
    statusBar = new StatusBar();
    responsePanel = new ResponsePanel();
    codeLensProvider = new HttpCodeLensProvider();
    fileWatcher = new FileWatcher();
    documentWatcher = new DocumentWatcher();

    await environmentManager.loadEnvironments();
    const currentEnv = environmentManager.getCurrentEnvironment();
    if (currentEnv) {
      logger.info(`Loaded environment: ${currentEnv.name} with ${currentEnv.variables.size} variables`);
    }

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

    // Register commands
    const sendRequestCmd = vscode.commands.registerCommand(
      'http-client.sendRequest',
      async (uri: vscode.Uri, lineNumber: number) => {
        try {
          logger.info(`Send request at line ${lineNumber} in ${uri.fsPath}`);

          // Read document
          const document = await vscode.workspace.openTextDocument(uri);
          const content = document.getText();

          // Parse requests
          const parseResult = httpParser.parse(content);
          if (!parseResult.success) {
            const errorMsg = parseResult.errors.map((e) => e.message).join(', ');
            vscode.window.showErrorMessage(`Parse error: ${errorMsg}`);
            responsePanel.displayError(errorMsg);
            return;
          }

          // Find request at the given line
          const request = parseResult.requests.find((r) => r.lineNumber === lineNumber);
          if (!request) {
            vscode.window.showErrorMessage('No request found at this line');
            return;
          }

          // Validate request
          const validationError = requestValidator.validate(request);
          if (validationError) {
            vscode.window.showErrorMessage(`Validation error: ${validationError.message}`);
            responsePanel.displayError(validationError.message);
            return;
          }

                    // Resolve environment variables
          const currentEnv = environmentManager.getCurrentEnvironment();
          const resolvedRequest = envResolver.resolveRequest(request, currentEnv);

          // Use resolvedRequest instead of request for HttpRequest creation
          const httpRequest: HttpRequest = {
            id: resolvedRequest.id,
            method: resolvedRequest.method,
            url: resolvedRequest.url,
            headers: resolvedRequest.headers,
            body: resolvedRequest.body,
            timeout: 30000,
            metadata: {
              fileUri: uri.toString(),
              lineNumber: resolvedRequest.lineNumber,
              timestamp: Date.now()
            },
          };

          // Execute request
          statusBar.setActiveRequestCount(1);
          responsePanel.displayLoading();

          const response = await httpClient.send(httpRequest);

          statusBar.setActiveRequestCount(0);
          responsePanel.displayResponse(response);

          if (response.error) {
            vscode.window.showWarningMessage(
              `Request completed with error: ${response.error.userMessage}`
            );
          } else {
            vscode.window.showInformationMessage(
              `Request completed: ${response.statusCode} ${response.statusText}`
            );
          }
        } catch (error) {
          statusBar.setActiveRequestCount(0);
          logger.error(`Failed to execute request: ${error}`);
          responsePanel.displayError(`Unexpected error: ${error}`);
          vscode.window.showErrorMessage(`Request failed: ${error}`);
        }
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

    const focusResponseCmd = vscode.commands.registerCommand('http-client.focus', () => {
      responsePanel.show();
    });

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
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
import { ParsedRequest } from './parser/types';
import { environmentManager } from './storage/environmentManager';
import { envResolver } from './env/envResolver';
import { ResponseChainManager } from './storage/responseChainManager';
import { DEFAULT_REQUEST_TIMEOUT } from './utils/constants';

let codeLensProvider: HttpCodeLensProvider;
let fileWatcher: FileWatcher;
let documentWatcher: DocumentWatcher;
let statusBar: StatusBar;
let responsePanel: ResponsePanel;
let responseChainManager: ResponseChainManager;

const activeRequests = new Map<string, { cancelled: boolean; controller?: AbortController }>();
let activeRequestCount = 0;

export async function activate(context: vscode.ExtensionContext) {
  logger.info('HTTP Client extension activating...');

  try {
    statusBar = new StatusBar();
    responsePanel = new ResponsePanel();
    codeLensProvider = new HttpCodeLensProvider();
    fileWatcher = new FileWatcher();
    documentWatcher = new DocumentWatcher();
    responseChainManager = new ResponseChainManager(context);

    envResolver.setResponseChainManager(responseChainManager);

    await environmentManager.loadEnvironments();
    const currentEnv = environmentManager.getCurrentEnvironment();
    if (currentEnv) {
      logger.info(
        `Loaded environment: ${currentEnv.name} with ${currentEnv.variables.size} variables`
      );
    }

    const codeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
      [
        { language: 'http', scheme: 'file' },
        { language: 'rest', scheme: 'file' },
      ],
      codeLensProvider
    );

    const documentChangeDisposable = documentWatcher.onDidChangeDocument(() => {
      codeLensProvider.notifyDocumentChanged();
    });

    const fileWatcherDisposable = fileWatcher.startWatching(
      (uri) => logger.info(`New HTTP file created: ${uri.fsPath}`),
      (uri) => {
        logger.debug(`HTTP file changed: ${uri.fsPath}`);
        codeLensProvider.notifyDocumentChanged();
      },
      (uri) => logger.info(`HTTP file deleted: ${uri.fsPath}`)
    );

    context.subscriptions.push(fileWatcherDisposable);

    const sendRequestCmd = vscode.commands.registerCommand(
      'http-client.sendRequest',
      async (uri: vscode.Uri, lineNumber: number) => {
        try {
          logger.info(`Send request at line ${lineNumber} in ${uri.fsPath}`);

          const document = await vscode.workspace.openTextDocument(uri);
          const content = document.getText();

          const parseResult = httpParser.parse(content);
          if (!parseResult.success) {
            const errorMsg = parseResult.errors.map((e) => e.message).join(', ');
            logger.error(`Parse error: ${errorMsg}`);
            vscode.window.showErrorMessage(`Parse error: ${errorMsg}`);
            responsePanel.displayError(errorMsg);
            return;
          }

          const request = parseResult.requests.find((r) => r.lineNumber === lineNumber);
          if (!request) {
            logger.error('No request found at this line');
            vscode.window.showErrorMessage('No request found at this line');
            return;
          }

          const validationError = requestValidator.validate(request);
          if (validationError) {
            logger.error(`Validation error: ${validationError.message}`);
            vscode.window.showErrorMessage(`Validation error: ${validationError.message}`);
            responsePanel.displayError(validationError.message);
            return;
          }

          let resolvedRequest = request;
          try {
            resolvedRequest = envResolver.resolve(request);
          } catch (err) {
            logger.error(`Environment resolution failed: ${err}`);
            vscode.window.showErrorMessage(`Failed to resolve environment variables: ${err}`);
            responsePanel.displayError(`Failed to resolve environment variables: ${err}`);
            statusBar.setActiveRequestCount(0);
            return;
          }

          const wsRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
          logger.info(`Extension workspace root: ${wsRoot}`);

          const httpRequest: HttpRequest = {
            id: resolvedRequest.id,
            method: resolvedRequest.method,
            url: resolvedRequest.url,
            headers: resolvedRequest.headers,
            body: resolvedRequest.body,
            workspaceRoot: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
            timeout: DEFAULT_REQUEST_TIMEOUT,
            metadata: {
              fileUri: uri.toString(),
              lineNumber: resolvedRequest.lineNumber,
              timestamp: Date.now(),
            },
          };

          const controller = new AbortController();
          activeRequests.set(httpRequest.id, { cancelled: false, controller });

          activeRequestCount++;
          statusBar.setActiveRequestCount(activeRequestCount);
          responsePanel.displayLoading(httpRequest.id);

          const response = await httpClient.send(httpRequest, controller.signal);

          const tracker = activeRequests.get(httpRequest.id);
          activeRequests.delete(httpRequest.id);
          activeRequestCount--;
          statusBar.setActiveRequestCount(activeRequestCount);

          if (tracker?.cancelled) {
            logger.info(`Response for request ${httpRequest.id} ignored because it was cancelled`);
            return;
          }

          try {
            if (resolvedRequest.name) {
              responseChainManager.saveResponse(resolvedRequest.name, response);
            }
          } catch (e) {
            logger.debug(`Failed to save response to chain manager: ${e}`);
          }

          responsePanel.show();
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
          if ((error as any).name === 'CanceledError') {
            return;
          }

          activeRequestCount--;
          statusBar.setActiveRequestCount(activeRequestCount);
          logger.error(`Failed to execute request: ${error}`);
          responsePanel.displayError(`Unexpected error: ${error}`);
          vscode.window.showErrorMessage(`Request failed: ${error}`);
        }
      }
    );

    const cancelRequestCmd = vscode.commands.registerCommand('http-client.cancelRequest', () => {
      logger.info('Cancel request command executed');

      for (const [id, info] of activeRequests.entries()) {
        info.cancelled = true;
        if (info.controller) {
          try {
            info.controller.abort();
          } catch (e) {
            logger.debug(`Failed to abort controller for request ${id}: ${e}`);
          }
        }
      }
      activeRequests.clear();
      statusBar.setActiveRequestCount(0);
      statusBar.showError('Request cancelled');
      responsePanel.displayError('Request cancelled by user');
    });

    function generateCurlCommand(request: ParsedRequest): string {
      let cmd = `curl -X ${request.method}`;

      cmd += ` '${request.url}'`;

      if (request.headers.size > 0) {
        for (const [key, value] of request.headers.entries()) {
          cmd += ` -H '${key}: ${value}'`;
        }
      }

      if (request.body && request.method !== 'GET' && request.method !== 'HEAD') {
        cmd += ` -d '${request.body.replace(/'/g, "'\\''")}'`;
      }

      return cmd;
    }

    const copyAsCurlCmd = vscode.commands.registerCommand(
      'http-client.copyAsCurl',
      async (uri: vscode.Uri, lineNumber: number) => {
        logger.info(`Copy as cURL at line ${lineNumber} in ${uri.fsPath}`);

        try {
          const document = await vscode.workspace.openTextDocument(uri);
          const content = document.getText();
          const parseResult = httpParser.parse(content);

          if (!parseResult.success) {
            vscode.window.showErrorMessage('Failed to parse request');
            return;
          }

          const request = parseResult.requests.find((r) => r.lineNumber === lineNumber);
          if (!request) {
            vscode.window.showErrorMessage('No request found at this line');
            return;
          }

          const curlCmd = generateCurlCommand(request);
          vscode.env.clipboard.writeText(curlCmd);
          vscode.window.showInformationMessage('Copied as cURL to clipboard');
        } catch (error) {
          logger.error(`Failed to copy as cURL: ${error}`);
          vscode.window.showErrorMessage(`Failed to copy as cURL: ${error}`);
        }
      }
    );

    const focusResponseCmd = vscode.commands.registerCommand('http-client.focus', () => {
      responsePanel.show();
    });

    const clearChainCommand = vscode.commands.registerCommand('http-client.clearChain', () => {
      responseChainManager.clearAll();
      vscode.window.showInformationMessage('Cleared all saved responses');
    });

    context.subscriptions.push(
      codeLensProviderDisposable,
      documentChangeDisposable,
      sendRequestCmd,
      cancelRequestCmd,
      copyAsCurlCmd,
      focusResponseCmd,
      clearChainCommand,
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

  for (const [, info] of activeRequests.entries()) {
    info.cancelled = true;
    if (info.controller) {
      try {
        info.controller.abort();
      } catch (e) {
        logger.debug(`Error aborting controller during deactivate: ${e}`);
      }
    }
  }
  activeRequests.clear();

  try {
    if (statusBar && typeof (statusBar as any).dispose === 'function') {
      (statusBar as any).dispose();
    }
    if (responsePanel && typeof (responsePanel as any).dispose === 'function') {
      (responsePanel as any).dispose();
    }
    if (fileWatcher && typeof (fileWatcher as any).dispose === 'function') {
      (fileWatcher as any).dispose();
    }
    if (documentWatcher && typeof (documentWatcher as any).dispose === 'function') {
      (documentWatcher as any).dispose();
    }
    if (codeLensProvider && typeof (codeLensProvider as any).dispose === 'function') {
      (codeLensProvider as any).dispose();
    }
  } catch (e) {
    logger.error(`Error during deactivate dispose: ${e}`);
  }
}

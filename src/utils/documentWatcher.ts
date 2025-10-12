import * as vscode from 'vscode';
import { logger } from './logger';

export type DocumentChangeListener = (document: vscode.TextDocument) => void;

export class DocumentWatcher {
  private listeners: DocumentChangeListener[] = [];
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(
      (event) => {
        const { document } = event;
        if (this.isHttpDocument(document)) {
          logger.debug(`Document changed: ${document.uri.fsPath}`);
          this.notifyListeners(document);
        }
      }
    );

    this.disposables.push(onDidChangeTextDocument);
  }

  private isHttpDocument(document: vscode.TextDocument): boolean {
    const languageId = document.languageId;
    return languageId === 'http' || languageId === 'rest';
  }

  onDidChangeDocument(listener: DocumentChangeListener): vscode.Disposable {
    this.listeners.push(listener);
    return {
      dispose: () => {
        const index = this.listeners.indexOf(listener);
        if (index !== -1) {
          this.listeners.splice(index, 1);
        }
      },
    };
  }

  private notifyListeners(document: vscode.TextDocument): void {
    this.listeners.forEach((listener) => {
      try {
        listener(document);
      } catch (error) {
        logger.error(`Error in document change listener: ${error}`);
      }
    });
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.listeners = [];
    logger.info('Document watcher disposed');
  }
}
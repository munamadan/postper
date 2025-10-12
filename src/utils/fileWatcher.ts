import * as vscode from 'vscode';
import { logger } from './logger';

export class FileWatcher {
  private watchers: vscode.FileSystemWatcher[] = [];
  private readonly filePattern = '**/*.{http,rest}';

  startWatching(
    onCreated?: (uri: vscode.Uri) => void,
    onChanged?: (uri: vscode.Uri) => void,
    onDeleted?: (uri: vscode.Uri) => void
  ): void {
    const watcher = vscode.workspace.createFileSystemWatcher(this.filePattern);

    if (onCreated) {
      watcher.onDidCreate((uri) => {
        logger.info(`File created: ${uri.fsPath}`);
        onCreated(uri);
      });
    }

    if (onChanged) {
      watcher.onDidChange((uri) => {
        logger.debug(`File changed: ${uri.fsPath}`);
        onChanged(uri);
      });
    }

    if (onDeleted) {
      watcher.onDidDelete((uri) => {
        logger.info(`File deleted: ${uri.fsPath}`);
        onDeleted(uri);
      });
    }

    this.watchers.push(watcher);
    logger.info('File watcher started');
  }

  dispose(): void {
    this.watchers.forEach((watcher) => watcher.dispose());
    this.watchers = [];
    logger.info('File watchers disposed');
  }
}
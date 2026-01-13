import * as vscode from 'vscode';
import { logger } from './logger';
import { HTTP_FILE_PATTERN } from './constants';

export class FileWatcher {
  private watchers: vscode.FileSystemWatcher[] = [];
  private readonly filePattern = HTTP_FILE_PATTERN;

  startWatching(
    onCreated?: (uri: vscode.Uri) => void,
    onChanged?: (uri: vscode.Uri) => void,
    onDeleted?: (uri: vscode.Uri) => void
  ): vscode.Disposable {
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

    // Return a composite disposable
    return new vscode.Disposable(() => {
      watcher.dispose();
      const index = this.watchers.indexOf(watcher);
      if (index !== -1) {
        this.watchers.splice(index, 1);
      }
    });
  }

  dispose(): void {
    this.watchers.forEach((watcher) => watcher.dispose());
    this.watchers = [];
    logger.info('File watchers disposed');
  }
}

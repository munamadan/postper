import * as vscode from 'vscode';

export class HttpCodeLensProvider implements vscode.CodeLensProvider {
  private codeLensChangeEmitter = new vscode.EventEmitter<void>();
  onDidChangeCodeLenses = this.codeLensChangeEmitter.event;

  provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.CodeLens[] {
    const codeLenses: vscode.CodeLens[] = [];

    // Placeholder: Will parse document in Phase 2
    // For now, just show CodeLens on lines that start with HTTP methods
    const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

    for (let lineNum = 0; lineNum < document.lineCount; lineNum++) {
      const line = document.lineAt(lineNum);
      const trimmedLine = line.text.trim();

      // Check if line starts with HTTP method
      if (httpMethods.some((method) => trimmedLine.startsWith(method))) {
        const range = new vscode.Range(lineNum, 0, lineNum, line.text.length);

        const sendCodeLens = new vscode.CodeLens(range, {
          title: '$(play) Send Request',
          command: 'http-client.sendRequest',
          arguments: [document.uri, lineNum],
        });

        const copyCodeLens = new vscode.CodeLens(range, {
          title: '$(copy) Copy as cURL',
          command: 'http-client.copyAsCurl',
          arguments: [document.uri, lineNum],
        });

        codeLenses.push(sendCodeLens, copyCodeLens);
      }
    }

    return codeLenses;
  }

  notifyDocumentChanged(): void {
    this.codeLensChangeEmitter.fire();
  }

  dispose(): void {
    this.codeLensChangeEmitter.dispose();
  }
}
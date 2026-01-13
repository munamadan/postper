import * as vscode from 'vscode';
import { httpParser } from '../parser/httpParser';

export class HttpCodeLensProvider implements vscode.CodeLensProvider {
  private codeLensChangeEmitter = new vscode.EventEmitter<void>();
  onDidChangeCodeLenses = this.codeLensChangeEmitter.event;

  provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.CodeLens[] {
    const codeLenses: vscode.CodeLens[] = [];

    const parseResult = httpParser.parse(document.getText());

    if (!parseResult.success || parseResult.requests.length === 0) {
      return codeLenses;
    }

    for (const request of parseResult.requests) {
      const line = document.lineAt(request.lineNumber - 1);
      const range = new vscode.Range(
        request.lineNumber - 1,
        0,
        request.lineNumber - 1,
        line.text.length
      );

      const sendCodeLens = new vscode.CodeLens(range, {
        title: '$(play) Send Request',
        command: 'http-client.sendRequest',
        arguments: [document.uri, request.lineNumber],
      });

      const copyCodeLens = new vscode.CodeLens(range, {
        title: '$(copy) Copy as cURL',
        command: 'http-client.copyAsCurl',
        arguments: [document.uri, request.lineNumber],
      });

      codeLenses.push(sendCodeLens, copyCodeLens);
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

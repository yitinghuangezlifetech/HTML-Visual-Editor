import * as vscode from 'vscode';
import * as path from 'path';
import { resolveResources } from './utils/resourceResolver';

interface Message {
  type: string;
  payload?: any;
}

export class HtmlEditorProvider implements vscode.CustomTextEditorProvider {
  private static readonly viewType = 'htmlVisualEditor.editor';

  static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.window.registerCustomTextEditorProvider(
      HtmlEditorProvider.viewType,
      new HtmlEditorProvider(context),
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      }
    );
  }

  constructor(private readonly context: vscode.ExtensionContext) {}

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        this.context.extensionUri,
        vscode.Uri.file(path.dirname(document.uri.fsPath)),
      ],
    };

    const nonce = this.getNonce();
    webviewPanel.webview.html = this.getWebviewContent(webviewPanel.webview, nonce);

    // 監聽檔案外部變更
    const changeSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) {
        this.postMessage(webviewPanel, {
          type: 'revert',
          payload: { html: document.getText() },
        });
      }
    });

    // 監聽 WebView 訊息
    webviewPanel.webview.onDidReceiveMessage(
      (message: Message) => this.handleMessage(message, document, webviewPanel),
      undefined,
      this.context.subscriptions
    );

    webviewPanel.onDidDispose(() => {
      changeSubscription.dispose();
    });

    // 推送初始內容
    setTimeout(() => {
      const html = document.getText();
      const baseUri = vscode.Uri.file(path.dirname(document.uri.fsPath)).toString();
      this.postMessage(webviewPanel, {
        type: 'init',
        payload: {
          html: resolveResources(html, document.uri, webviewPanel.webview),
          baseUri,
        },
      });
    }, 100);
  }

  private async handleMessage(
    message: Message,
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel
  ): Promise<void> {
    switch (message.type) {
      case 'ready':
        console.log('WebView ready');
        break;

      case 'edit': {
        const newHtml = message.payload.html;
        const edit = new vscode.WorkspaceEdit();
        const range = new vscode.Range(
          0,
          0,
          document.lineCount,
          document.lineAt(document.lineCount - 1).range.end.character
        );
        edit.replace(document.uri, range, newHtml);
        await vscode.workspace.applyEdit(edit);
        break;
      }

      case 'save': {
        await document.save();
        break;
      }

      case 'error':
        vscode.window.showErrorMessage(`Editor error: ${message.payload.message}`);
        break;
    }
  }

  private postMessage(
    webviewPanel: vscode.WebviewPanel,
    message: Message
  ): Thenable<boolean> {
    return webviewPanel.webview.postMessage(message);
  }

  private getWebviewContent(webview: vscode.Webview, nonce: string): string {
    const bundleUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(this.context.extensionPath, 'media', 'editor-bundle.js'))
    );

    return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    script-src 'nonce-${nonce}' 'unsafe-inline';
    style-src 'unsafe-inline' ${webview.cspSource};
    frame-src * data:;
    img-src * data:;
    font-src * data:;
  ">
  <title>HTML Visual Editor</title>
  <style nonce="${nonce}">
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #1e1e1e;
      color: #d4d4d4;
      overflow: hidden;
    }
    #app {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .toolbar {
      padding: 8px 12px;
      background: #252526;
      border-bottom: 1px solid #3e3e42;
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .toolbar button {
      padding: 4px 8px;
      background: #007acc;
      color: white;
      border: none;
      border-radius: 2px;
      cursor: pointer;
      font-size: 12px;
    }
    .toolbar button:hover {
      background: #005a9e;
    }
    .editor-container {
      flex: 1;
      display: flex;
      gap: 1px;
      overflow: hidden;
      background: #1e1e1e;
    }
    .canvas-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .canvas-label {
      padding: 4px 12px;
      background: #2d2d30;
      border-bottom: 1px solid #3e3e42;
      font-size: 12px;
      color: #858585;
    }
    .canvas-frame {
      flex: 1;
      overflow: auto;
      background: #1e1e1e;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
      background: white;
    }
    .sidebar {
      width: 300px;
      background: #252526;
      border-left: 1px solid #3e3e42;
      display: flex;
      flex-direction: column;
    }
    .sidebar-tabs {
      display: flex;
      border-bottom: 1px solid #3e3e42;
    }
    .sidebar-tabs button {
      flex: 1;
      padding: 8px;
      background: transparent;
      border: none;
      color: #858585;
      cursor: pointer;
      font-size: 12px;
      border-bottom: 2px solid transparent;
    }
    .sidebar-tabs button.active {
      color: #e0e0e0;
      border-bottom-color: #007acc;
    }
    .sidebar-content {
      flex: 1;
      overflow: auto;
      padding: 8px;
    }
    .error {
      padding: 12px;
      background: #5a1d1d;
      color: #f48771;
      border-radius: 2px;
      font-size: 12px;
      margin: 12px;
    }
  </style>
</head>
<body>
  <div id="app">
    <div class="toolbar">
      <span>HTML Visual Editor</span>
      <button id="saveBtn" title="Save (Ctrl+S)">Save</button>
      <button id="undoBtn" title="Undo (Ctrl+Z)">Undo</button>
      <button id="redoBtn" title="Redo (Ctrl+Y)">Redo</button>
    </div>
    <div class="editor-container">
      <div class="canvas-wrapper">
        <div class="canvas-label">Canvas Preview</div>
        <div class="canvas-frame">
          <iframe id="canvas"></iframe>
        </div>
      </div>
      <div class="sidebar">
        <div class="sidebar-tabs">
          <button class="active">Properties</button>
        </div>
        <div class="sidebar-content">
          <p style="font-size: 12px; color: #858585;">Select an element to edit</p>
        </div>
      </div>
    </div>
  </div>

  <script nonce="${nonce}">
    console.log('🔧 WebView Script Starting...');

    // Test 1: Check acquireVsCodeApi
    try {
      const vscode = acquireVsCodeApi();
      console.log('✓ acquireVsCodeApi works');
    } catch (e) {
      console.error('✗ acquireVsCodeApi failed:', e);
    }

    // Test 2: Check canvas
    const canvas = document.getElementById('canvas');
    console.log('✓ Canvas element:', canvas ? 'FOUND' : 'NOT FOUND');

    // Test 3: Initialize editor
    window.addEventListener('load', () => {
      console.log('✓ Window load event fired');
    });

    document.addEventListener('DOMContentLoaded', () => {
      console.log('✓ DOMContentLoaded fired');
    });

    console.log('🎯 WebView Script Ready');
  </script>

  <script nonce="${nonce}" src="${bundleUri}"></script>
</body>
</html>`;
  }

  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}

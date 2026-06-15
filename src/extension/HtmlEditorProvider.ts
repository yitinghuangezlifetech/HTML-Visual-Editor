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
    #split {
      flex: 1;
      display: flex;
      overflow: hidden;
    }
    #panelLeft {
      flex: 0 0 30%;
      min-width: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #1e1e1e;
    }
    #panelLeft.collapsed {
      flex: 0 0 0% !important;
      overflow: hidden;
    }
    #panelLeft.collapsed #sourceArea {
      display: none;
    }
    #resizer {
      width: 4px;
      background: #3e3e42;
      cursor: col-resize;
      flex-shrink: 0;
      transition: background 0.1s;
    }
    #resizer:hover, #resizer.dragging {
      background: #007acc;
    }
    #panelLeft.collapsed + #resizer {
      display: none;
    }
    .canvas-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }
    .panel-label {
      padding: 4px 12px;
      background: #2d2d30;
      border-bottom: 1px solid #3e3e42;
      font-size: 12px;
      color: #858585;
      flex-shrink: 0;
    }
    #sourceArea {
      flex: 1;
      width: 100%;
      background: #1e1e1e;
      color: #d4d4d4;
      border: none;
      resize: none;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 13px;
      padding: 8px;
      outline: none;
      overflow: auto;
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
    .error {
      padding: 12px;
      background: #5a1d1d;
      color: #f48771;
      border-radius: 2px;
      font-size: 12px;
      margin: 12px;
    }
    #toggleSourceBtn {
      background: #3e3e42 !important;
      color: #d4d4d4 !important;
    }
    #toggleSourceBtn:hover {
      background: #505050 !important;
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
      <button id="toggleSourceBtn" title="收闔/展開原始碼">◀ 收闔原始碼</button>
    </div>
    <div id="split">
      <div id="panelLeft">
        <div class="panel-label">原始碼</div>
        <textarea id="sourceArea" spellcheck="false"></textarea>
      </div>
      <div id="resizer"></div>
      <div class="canvas-wrapper">
        <div class="panel-label">Canvas Preview</div>
        <div class="canvas-frame">
          <iframe id="canvas"></iframe>
        </div>
      </div>
    </div>
  </div>

  <script nonce="${nonce}">
    (function () {
      const panelLeft      = document.getElementById('panelLeft');
      const resizer        = document.getElementById('resizer');
      const splitEl        = document.getElementById('split');
      const toggleBtn      = document.getElementById('toggleSourceBtn');
      const canvasIframe   = document.getElementById('canvas');

      let isCollapsed = false;
      let lastWidth   = '30%';

      // ── Toggle collapse ──────────────────────────────────────────────────────
      toggleBtn.addEventListener('click', function () {
        if (!isCollapsed) {
          lastWidth = panelLeft.style.flexBasis || '30%';
          panelLeft.classList.add('collapsed');
          toggleBtn.textContent = '▶ 展開原始碼';
          isCollapsed = true;
        } else {
          panelLeft.classList.remove('collapsed');
          panelLeft.style.flex = '0 0 ' + lastWidth;
          toggleBtn.textContent = '◀ 收闔原始碼';
          isCollapsed = false;
        }
      });

      // ── Drag-to-resize ───────────────────────────────────────────────────────
      let dragging = false, dragStartX = 0, dragStartW = 0;

      resizer.addEventListener('mousedown', function (e) {
        dragging    = true;
        dragStartX  = e.clientX;
        dragStartW  = panelLeft.getBoundingClientRect().width;
        resizer.classList.add('dragging');
        document.body.style.cursor     = 'col-resize';
        document.body.style.userSelect = 'none';
        canvasIframe.style.pointerEvents = 'none';
      });

      document.addEventListener('mousemove', function (e) {
        if (!dragging) return;
        const total = splitEl.getBoundingClientRect().width;
        const pct   = Math.min(80, Math.max(10, ((dragStartW + e.clientX - dragStartX) / total) * 100));
        panelLeft.style.flex = '0 0 ' + pct.toFixed(1) + '%';
      });

      document.addEventListener('mouseup', function () {
        if (!dragging) return;
        dragging = false;
        resizer.classList.remove('dragging');
        document.body.style.cursor       = '';
        document.body.style.userSelect   = '';
        canvasIframe.style.pointerEvents = '';
      });
    })();
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

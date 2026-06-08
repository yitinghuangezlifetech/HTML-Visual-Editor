import * as vscode from 'vscode';
import * as path from 'path';

class SimpleHtmlEditor implements vscode.CustomTextEditorProvider {
  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(path.dirname(document.uri.fsPath))],
    };

    webviewPanel.webview.html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial; margin: 0; padding: 10px; background: #1e1e1e; color: #d4d4d4; }
          .container { display: flex; height: 100vh; gap: 1px; }
          .editor { flex: 1; background: #252526; padding: 10px; overflow: auto; border: 1px solid #3e3e42; }
          .preview { flex: 1; background: white; padding: 10px; overflow: auto; border: 1px solid #3e3e42; }
          textarea { width: 100%; height: 100%; border: none; background: #1e1e1e; color: #d4d4d4; font-family: monospace; padding: 10px; box-sizing: border-box; }
          iframe { width: 100%; height: 100%; border: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="editor">
            <textarea id="code"></textarea>
          </div>
          <div class="preview">
            <iframe id="preview"></iframe>
          </div>
        </div>

        <script>
          const code = document.getElementById('code');
          const preview = document.getElementById('preview');

          // 初始化
          const vscode = acquireVsCodeApi();
          code.value = \`${document.getText().replace(/\`/g, '\\`')}\`;

          // 實時預覽
          code.addEventListener('input', () => {
            preview.srcdoc = code.value;
          });

          // 首次載入
          preview.srcdoc = code.value;

          // 保存（Ctrl+S）
          document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
              e.preventDefault();
              vscode.postMessage({ type: 'save', html: code.value });
            }
          });
        </script>
      </body>
      </html>
    `;

    // 接收保存訊息
    webviewPanel.webview.onDidReceiveMessage((msg) => {
      if (msg.type === 'save') {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), msg.html);
        vscode.workspace.applyEdit(edit);
      }
    });
  }
}

export function activate(context: vscode.ExtensionContext) {
  const provider = new SimpleHtmlEditor();
  context.subscriptions.push(
    vscode.window.registerCustomTextEditorProvider('htmlVisualEditor.editor', provider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );
  console.log('✓ Simple HTML Visual Editor activated');
}

export function deactivate() {}

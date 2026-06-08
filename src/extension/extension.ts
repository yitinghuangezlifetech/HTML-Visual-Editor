import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { htmlToMarkdown } from './utils/htmlToMarkdown';
import { markdownToHtml } from './utils/markdownToHtml';

// Extension context held for use inside HtmlEditorProvider
let _extensionContext: vscode.ExtensionContext;

class HtmlEditorProvider implements vscode.CustomEditorProvider {
  public async openCustomDocument(uri: vscode.Uri): Promise<vscode.CustomDocument> {
    return { uri, dispose: () => {} };
  }

  public async resolveCustomEditor(
    document: vscode.CustomDocument,
    webviewPanel: vscode.WebviewPanel
  ): Promise<void> {
    const mediaPath = vscode.Uri.file(
      path.join(_extensionContext.extensionPath, 'media')
    );

    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        mediaPath,
        vscode.Uri.file(path.dirname(document.uri.fsPath)),
      ],
    };

    const bundleUri = webviewPanel.webview.asWebviewUri(
      vscode.Uri.file(path.join(_extensionContext.extensionPath, 'media', 'rich-editor-bundle.js'))
    );

    webviewPanel.webview.onDidReceiveMessage(async (message) => {
      if (message.type === 'save') {
        try {
          const content = message.payload.html as string;
          // Wrap bare fragment in a full HTML document
          const toWrite = content.trimStart().startsWith('<!DOCTYPE') || content.trimStart().startsWith('<html')
            ? content
            : `<!DOCTYPE html>\n<html lang="zh-TW">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${path.basename(document.uri.fsPath, '.html')}</title>\n</head>\n<body>\n${content}\n</body>\n</html>`;

          fs.writeFileSync(document.uri.fsPath, toWrite, 'utf-8');

          // Also save as Markdown
          const mdPath = document.uri.fsPath.replace(/\.html$/i, '.md');
          const markdown = htmlToMarkdown(toWrite);
          fs.writeFileSync(mdPath, markdown, 'utf-8');

          webviewPanel.webview.postMessage({ type: 'saved', timestamp: new Date().toISOString() });
          console.log(`[HTML-Editor] ✅ Saved: ${document.uri.fsPath}`);
          console.log(`[HTML-Editor] ✅ Saved Markdown: ${mdPath}`);
        } catch (error: any) {
          const msg = error?.message || String(error);
          webviewPanel.webview.postMessage({ type: 'saveFailed', error: msg });
          vscode.window.showErrorMessage(`Failed to save: ${msg}`);
        }
      } else if (message.type === 'ready') {
        try {
          const html = fs.readFileSync(document.uri.fsPath, 'utf-8');
          webviewPanel.webview.postMessage({ type: 'init', payload: { html } });
        } catch (error: any) {
          vscode.window.showErrorMessage(`Failed to read file: ${error?.message}`);
        }
      } else if (message.type === 'openLink') {
        const raw: string = (message.raw || '').trim();
        if (!raw || raw.startsWith('#')) return; // anchor-only links → ignore

        try {
          // External links (http / https / mailto / //)
          if (/^https?:\/\//i.test(raw) || /^\/\//i.test(raw) || /^mailto:/i.test(raw)) {
            await vscode.env.openExternal(vscode.Uri.parse(raw));
            return;
          }

          // Relative local file links → resolve against current file's directory
          const dir = path.dirname(document.uri.fsPath);
          const filePart = decodeURIComponent(raw.split('#')[0].split('?')[0]);
          if (filePart) {
            const target = path.resolve(dir, filePart);
            if (fs.existsSync(target)) {
              await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(target));
              return;
            }
          }
          // Nothing matched — silently ignore (avoids "about:" error dialog)
        } catch (error: any) {
          vscode.window.showErrorMessage(`Cannot open link: ${error?.message}`);
        }
      }
    });

    // Read file content
    let fileContent = '';
    try {
      fileContent = fs.readFileSync(document.uri.fsPath, 'utf-8');
    } catch (error) {
      fileContent = '<!-- Failed to read file -->';
    }

    webviewPanel.webview.html = this.getWebviewContent(webviewPanel.webview, bundleUri.toString(), fileContent);
  }

  private getWebviewContent(webview: vscode.Webview, bundleUri: string, fileContent: string = ''): string {
    const csp = [
      `default-src 'none'`,
      `style-src 'unsafe-inline' ${webview.cspSource}`,
      `script-src 'unsafe-inline' ${webview.cspSource}`,
      `img-src * data: blob: ${webview.cspSource}`,
      `font-src * data: ${webview.cspSource}`,
      // Preview pane renders user HTML in an <iframe srcdoc>; allow it to load.
      `frame-src * data: blob:`,
    ].join('; ');

    return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <title>HTML Visual Editor</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; overflow: hidden; }
    body { display: flex; flex-direction: column; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif; background: #1e1e1e; color: #d4d4d4; }

    .topbar { display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: #252526; border-bottom: 1px solid #3e3e42; flex-shrink: 0; }
    .topbar-title { font-size: 13px; font-weight: 600; color: #ccc; margin-right: 8px; }
    .topbar button { padding: 4px 11px; border: none; border-radius: 3px; font-size: 12px; cursor: pointer; background: #0e639c; color: #fff; }
    .topbar button:hover { background: #1177bb; }
    .topbar button#saveBtn { background: #2d7d46; }
    .topbar button#saveBtn:hover { background: #3a9c5a; }
    .status { margin-left: auto; font-size: 11px; color: #888; min-width: 160px; text-align: right; }
    .status.saved { color: #6a9955; }
    .status.error { color: #f48771; }

    .split { flex: 1; display: flex; flex-direction: row; overflow: hidden; }
    .panel-left, .panel-right { display: flex; flex-direction: column; overflow: hidden; min-width: 80px; }
    .panel-left  { flex: 0 0 50%; }
    .panel-right { flex: 1; background: #fff; }

    .resizer { width: 5px; background: #3e3e42; cursor: col-resize; flex-shrink: 0; position: relative; z-index: 10; }
    .resizer:hover, .resizer.dragging { background: #007acc; }

    .panel-header { display: flex; align-items: center; gap: 4px; padding: 4px 10px; background: #2d2d30; border-bottom: 1px solid #3e3e42; flex-shrink: 0; user-select: none; }
    .panel-header .label { font-size: 11px; font-weight: 600; color: #858585; letter-spacing: 0.5px; text-transform: uppercase; flex: 1; }
    .zoom-btn { padding: 1px 7px; border: 1px solid #555; border-radius: 3px; background: transparent; color: #aaa; font-size: 13px; font-weight: bold; cursor: pointer; }
    .zoom-btn:hover { background: #3e3e42; color: #fff; }
    .zoom-label { font-size: 11px; color: #666; min-width: 32px; text-align: center; }
    .win-btn { padding: 1px 6px; border: 1px solid #555; border-radius: 3px; background: transparent; color: #aaa; font-size: 11px; cursor: pointer; }
    .win-btn:hover  { background: #3e3e42; color: #fff; }
    .win-btn.active { background: #6c4fb3; color: #fff; border-color: #6c4fb3; }
    .win-sep { width: 1px; height: 12px; background: #444; margin: 0 2px; }

    .search-bar { display: none; align-items: center; gap: 4px; padding: 4px 10px; background: #1e1e1e; border-bottom: 1px solid #3e3e42; flex-shrink: 0; }
    .search-bar input { flex: 1; background: #3c3c3c; border: 1px solid #555; border-radius: 3px; color: #d4d4d4; font-size: 12px; padding: 3px 8px; outline: none; min-width: 0; }
    .search-bar input:focus { border-color: #007acc; }
    .search-bar input.no-match { border-color: #f48771; background: #4a2020; }
    .match-count { font-size: 11px; color: #888; min-width: 44px; text-align: right; white-space: nowrap; }
    .s-btn { padding: 2px 7px; border: 1px solid #555; border-radius: 3px; background: transparent; color: #aaa; font-size: 12px; cursor: pointer; }
    .s-btn:hover { background: #3e3e42; color: #fff; }
    .s-btn.close-btn { font-size: 14px; padding: 1px 6px; }

    /* Left: source code textarea */
    #sourceArea { flex: 1; width: 100%; padding: 12px; background: #1e1e1e; color: #d4d4d4; border: none; font-family: 'Consolas', 'Courier New', monospace; font-size: 13px; line-height: 1.6; resize: none; outline: none; tab-size: 2; }

    /* Right: Quill rich editor */
    #editorWrap { display: flex; flex: 1; flex-direction: column; overflow: hidden; }
    .ql-toolbar.ql-snow { background: #2d2d30; border: none; border-bottom: 1px solid #3e3e42; padding: 5px 8px; flex-shrink: 0; }
    .ql-toolbar.ql-snow .ql-picker-label, .ql-toolbar.ql-snow button { color: #bbb !important; }
    .ql-toolbar.ql-snow .ql-stroke { stroke: #bbb !important; }
    .ql-toolbar.ql-snow .ql-fill   { fill:   #bbb !important; }
    .ql-toolbar.ql-snow .ql-picker-options { background: #2d2d30; border-color: #555; color: #ccc; }
    .ql-container.ql-snow { flex: 1; border: none; overflow-y: auto; background: #fff; }
    .ql-editor { min-height: 100%; font-size: 14px; line-height: 1.8; color: #1a1a1a; padding: 20px 24px; }
    .ql-editor.ql-blank::before { color: #aaa; font-style: italic; }

    /* Right: live preview (hidden by default) */
    #preview { display: none; flex: 1; border: none; background: #fff; }
  </style>
</head>
<body>
  <div class="topbar">
    <span class="topbar-title">✏ HTML Visual Editor</span>
    <button id="saveBtn" title="Save (Ctrl+S)">💾 Save</button>
    <div class="status" id="status"></div>
  </div>

  <div class="split" id="split">
    <!-- Left: Source Code -->
    <div class="panel-left" id="panelLeft">
      <div class="panel-header">
        <span class="label">Source Code</span>
        <button class="zoom-btn" id="searchLeftBtn" title="搜尋 (Ctrl+F)">🔍</button>
        <div class="win-sep"></div>
        <button class="zoom-btn" id="zoomOut" title="縮小字體">A−</button>
        <span class="zoom-label" id="zoomLabel">13px</span>
        <button class="zoom-btn" id="zoomIn"  title="放大字體">A+</button>
        <div class="win-sep"></div>
        <button class="win-btn" id="winNarrow" title="左側佔 30%">◀ 30</button>
        <button class="win-btn" id="winHalf"   title="左側佔 50%">⬛ 50</button>
        <button class="win-btn" id="winWide"   title="左側佔 70%">70 ▶</button>
      </div>
      <div class="search-bar" id="searchLeft">
        <input type="text" id="searchLeftInput" placeholder="搜尋原始碼...">
        <span class="match-count" id="searchLeftCount"></span>
        <button class="s-btn" id="searchLeftPrev" title="上一個">↑</button>
        <button class="s-btn" id="searchLeftNext" title="下一個">↓</button>
        <button class="s-btn close-btn" id="searchLeftClose" title="關閉">✕</button>
      </div>
      <textarea id="sourceArea" spellcheck="false"></textarea>
    </div>

    <div class="resizer" id="resizer"></div>

    <!-- Right: Rich Editor + Preview -->
    <div class="panel-right" id="panelRight">
      <div class="panel-header">
        <span class="label" id="rightLabel">Rich Text Editor</span>
        <button class="zoom-btn" id="searchRightBtn" title="搜尋 (Ctrl+F)">🔍</button>
        <div class="win-sep"></div>
        <button class="win-btn active" id="btnRich"    title="Rich Text 編輯模式">🖊 Rich</button>
        <button class="win-btn"        id="btnPreview" title="預覽模式">👁 Preview</button>
      </div>
      <div class="search-bar" id="searchRight">
        <input type="text" id="searchRightInput" placeholder="搜尋內容...">
        <span class="match-count" id="searchRightCount"></span>
        <button class="s-btn" id="searchRightPrev" title="上一個">↑</button>
        <button class="s-btn" id="searchRightNext" title="下一個">↓</button>
        <button class="s-btn close-btn" id="searchRightClose" title="關閉">✕</button>
      </div>
      <div id="editorWrap">
        <div id="editor"></div>
      </div>
      <iframe id="preview" sandbox="allow-scripts allow-same-origin"></iframe>
    </div>
  </div>

  <script src="${bundleUri}"></script>
</body>
</html>`;
  }
}

export function activate(context: vscode.ExtensionContext) {
  _extensionContext = context;
  console.log('[HTML-Editor] ======================================');
  console.log('[HTML-Editor] EXTENSION ACTIVATING');
  console.log('[HTML-Editor] ======================================');

  try {
    const provider = new HtmlEditorProvider();

    const registration = vscode.window.registerCustomEditorProvider(
      'htmlVisualEditor.editor',
      provider,
      { webviewOptions: { retainContextWhenHidden: true } }
    );

    context.subscriptions.push(registration);

    // Auto-save HTML as Markdown
    const mdSyncDisposable = vscode.workspace.onDidSaveTextDocument((doc) => {
      if (doc.languageId !== 'html' && !doc.uri.fsPath.endsWith('.html')) return;

      const mdPath = doc.uri.fsPath.replace(/\.html$/i, '.md');
      try {
        const markdown = htmlToMarkdown(doc.getText());
        fs.writeFileSync(mdPath, markdown, 'utf-8');
        console.log(`[HTML-Editor] ✅ Auto-saved Markdown: ${mdPath}`);
      } catch (error: any) {
        console.error(`[HTML-Editor] ❌ Markdown auto-save failed: ${error?.message || error}`);
      }
    });
    context.subscriptions.push(mdSyncDisposable);

    // Auto-convert Markdown to HTML on save
    const htmlFromMdDisposable = vscode.workspace.onDidSaveTextDocument((doc) => {
      if (doc.languageId !== 'markdown' && !doc.uri.fsPath.endsWith('.md')) return;

      const htmlPath = doc.uri.fsPath.replace(/\.md$/i, '.html');
      const title = path.basename(doc.uri.fsPath, '.md');
      try {
        const html = markdownToHtml(doc.getText(), title);
        fs.writeFileSync(htmlPath, html, 'utf-8');
        console.log(`[HTML-Editor] ✅ Auto-saved HTML: ${htmlPath}`);
      } catch (error: any) {
        console.error(`[HTML-Editor] ❌ HTML auto-save failed: ${error?.message || error}`);
      }
    });
    context.subscriptions.push(htmlFromMdDisposable);

    console.log('[HTML-Editor] ✅ Provider registered: htmlVisualEditor.editor');
    console.log('[HTML-Editor] ✅ HTML → Markdown auto-sync enabled');
    console.log('[HTML-Editor] ✅ Markdown → HTML auto-sync enabled');
    console.log('[HTML-Editor] ======================================');
    console.log('[HTML-Editor] EXTENSION READY');
    console.log('[HTML-Editor] ======================================');
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.error('[HTML-Editor] ❌ Registration failed:', errorMsg);
    console.error('[HTML-Editor] Stack:', error?.stack);
  }
}

export function deactivate() {
  console.log('[HTML-Editor] Extension deactivated');
}

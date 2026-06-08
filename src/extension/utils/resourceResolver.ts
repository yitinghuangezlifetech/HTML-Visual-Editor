import * as vscode from 'vscode';
import * as path from 'path';

/**
 * 將 HTML 中的相對資源路徑轉為 WebView 可存取的 URI
 * - 相對路徑（如 ./styles.css）轉為 vscode-resource:// URI
 * - 絕對 CDN 路徑保持不動
 */
export function resolveResources(
  html: string,
  documentUri: vscode.Uri,
  webview: vscode.Webview
): string {
  const basePath = path.dirname(documentUri.fsPath);

  let result = html;

  // 轉換 <link href="..." > CSS
  result = result.replace(/href="(?!https?:\/\/)([^"]+\.css)"/gi, (match, relPath: string) => {
    try {
      const absPath = path.resolve(basePath, relPath);
      const uri = webview.asWebviewUri(vscode.Uri.file(absPath));
      return `href="${uri}"`;
    } catch {
      return match;
    }
  });

  // 轉換 <script src="..." > JS
  result = result.replace(/src="(?!https?:\/\/)([^"]+\.js)"/gi, (match, relPath: string) => {
    try {
      const absPath = path.resolve(basePath, relPath);
      const uri = webview.asWebviewUri(vscode.Uri.file(absPath));
      return `src="${uri}"`;
    } catch {
      return match;
    }
  });

  // 轉換 <img src="..." > 和其他 src
  result = result.replace(
    /src="(?!https?:\/\/)(?!data:)([^"]+\.(png|jpg|jpeg|gif|svg|webp|ico))"/gi,
    (match, relPath: string) => {
      try {
        const absPath = path.resolve(basePath, relPath);
        const uri = webview.asWebviewUri(vscode.Uri.file(absPath));
        return `src="${uri}"`;
      } catch {
        return match;
      }
    }
  );

  // 轉換 <link href="..." > 字體（woff, woff2, ttf 等）
  result = result.replace(
    /href="(?!https?:\/\/)([^"]+\.(woff|woff2|ttf|eot|otf))"/gi,
    (match, relPath: string) => {
      try {
        const absPath = path.resolve(basePath, relPath);
        const uri = webview.asWebviewUri(vscode.Uri.file(absPath));
        return `href="${uri}"`;
      } catch {
        return match;
      }
    }
  );

  return result;
}

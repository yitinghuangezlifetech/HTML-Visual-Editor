import { marked } from 'marked';
import { DEFAULT_THEME_CSS } from './theme';

/**
 * Markdown → 完整 HTML 文件。
 * 樣式統一由 theme.ts 供應（spec: .kiro/spec/export-theme/）：
 * 呼叫端可傳入 resolveThemeCss() 的結果；未傳入時使用內建「規格藍」主題。
 */
export function markdownToHtml(markdown: string, title?: string, css?: string): string {
  const body = marked(markdown) as string;
  const pageTitle = title || 'Document';
  const themeCss = css ?? DEFAULT_THEME_CSS;

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <style>
${themeCss}
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

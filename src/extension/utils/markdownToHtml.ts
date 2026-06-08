import { marked } from 'marked';

export function markdownToHtml(markdown: string, title?: string): string {
  const body = marked(markdown) as string;
  const pageTitle = title || 'Document';

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', Roboto, Oxygen, Ubuntu, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.8;
      color: #333;
      background: #fafafa;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 12px;
      font-weight: 600;
      color: #222;
    }
    h1 { font-size: 2em; border-bottom: 2px solid #667eea; padding-bottom: 12px; }
    h2 { font-size: 1.6em; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px; }
    h3 { font-size: 1.3em; }
    h4, h5, h6 { font-size: 1.1em; }
    p { margin-bottom: 12px; }
    a { color: #667eea; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', 'Consolas', monospace;
      font-size: 0.9em;
      color: #e83e8c;
    }
    pre {
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 16px;
      overflow-x: auto;
      margin: 16px 0;
    }
    pre code {
      background: none;
      padding: 0;
      color: #333;
    }
    blockquote {
      border-left: 4px solid #667eea;
      margin: 16px 0;
      padding-left: 16px;
      color: #666;
      font-style: italic;
    }
    ul, ol { margin: 12px 0 12px 24px; }
    li { margin-bottom: 8px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background: #f8f8f8;
      font-weight: 600;
      color: #333;
    }
    tr:nth-child(even) {
      background: #fafafa;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
      margin: 16px 0;
    }
    hr {
      margin: 24px 0;
      border: none;
      border-top: 1px solid #ddd;
    }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

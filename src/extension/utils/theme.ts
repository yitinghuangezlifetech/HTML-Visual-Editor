import * as fs from 'fs';
import * as path from 'path';
import { promoteTableHeaders } from './tableHeader';

/**
 * theme.ts — 匯出 HTML 主題樣式（spec: .kiro/spec/export-theme/）
 *
 * 樣式來源優先序：
 *   1. 文件所在目錄向上查找 `.kiro/assets/doc-style.css`（找到即「完整取代」內建主題）
 *   2. 找不到或讀取失敗 → 內建預設主題 DEFAULT_THEME_CSS（規格藍）
 *
 * 與 srs_sdd_bridge.py / md2html_specs.py 等其他轉換器共用 `.kiro/assets/doc-style.css`
 * 即可達成多工具輸出外觀一致。
 */

/** 專案約定的外部主題檔（自文件目錄向上查找） */
export const THEME_FILE_RELPATH = path.join('.kiro', 'assets', 'doc-style.css');

/** 向上查找層數上限（文件不在 workspace 內時的保險） */
const MAX_ASCEND = 30;

/** 內建預設主題「規格藍」：Noto Sans TC、藍色標題強調、圓角卡片表格、深色程式碼、深色模式、列印 */
export const DEFAULT_THEME_CSS = `body {
  font-family: "Noto Sans TC", "Microsoft JhengHei", "PingFang TC", system-ui, sans-serif;
  max-width: 920px;
  margin: 0 auto;
  padding: 2.5rem 2rem 4rem;
  line-height: 1.75;
  font-size: 16px;
  color: #1f2933;
  background: #f4f7fb;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
h1 {
  font-size: 1.9rem;
  font-weight: 700;
  letter-spacing: .01em;
  color: #0f2a52;
  margin: 0 0 1.2rem;
  padding-bottom: .55rem;
  background: linear-gradient(90deg, #2563eb 0 72px, #7dd3fc 72px 108px, transparent 108px) bottom left / 100% 4px no-repeat;
}
h2 {
  font-size: 1.4rem;
  font-weight: 700;
  color: #14336b;
  margin: 2.6rem 0 .9rem;
  padding-left: .7rem;
  position: relative;
}
h2::before {
  content: "";
  position: absolute;
  left: 0; top: .18em; bottom: .18em;
  width: 5px;
  border-radius: 3px;
  background: linear-gradient(180deg, #2563eb, #38bdf8);
}
h3 { font-size: 1.15rem; color: #1e40af; margin: 1.9rem 0 .6rem; font-weight: 700; }
h4, h5, h6 { color: #334e68; margin: 1.4rem 0 .4rem; }
p { margin: .55rem 0 .9rem; }
/* 編輯器區塊（.ve-block）於匯出檔以一般段落呈現；虛線框等編輯 UI 樣式僅存在 webview，不隨匯出 */
.ve-block { margin: .55rem 0 .9rem; }
a { color: #1d4ed8; text-decoration: none; border-bottom: 1px solid #bfdbfe; }
a:hover { color: #1e40af; border-bottom-color: #1d4ed8; background: #eff6ff; }
strong { color: #0f2a52; }
table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  margin: 1.1rem 0 1.4rem;
  font-size: .93rem;
  background: #fff;
  border: 1px solid #dbe4ee;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(15, 42, 82, .06);
}
th, td {
  border: none;
  border-bottom: 1px solid #e6edf5;
  padding: .55rem .8rem;
  text-align: left;
  vertical-align: top;
}
th {
  background: linear-gradient(180deg, #eff6ff, #e3eefc);
  color: #14336b;
  font-weight: 700;
  border-bottom: 2px solid #c7dbf5;
}
tr:last-child td { border-bottom: none; }
tbody tr:nth-child(even) td { background: #f8fafd; }
tbody tr:hover td { background: #eef5fe; }
code {
  font-family: "Cascadia Code", Consolas, "JetBrains Mono", monospace;
  background: #e8eef7;
  color: #0f3d91;
  padding: .12rem .4rem;
  border-radius: 5px;
  font-size: .88em;
}
pre {
  background: #0f172a;
  color: #e2e8f0;
  padding: 1rem 1.2rem;
  border-radius: 10px;
  border: 1px solid #1e293b;
  overflow-x: auto;
  line-height: 1.6;
  box-shadow: 0 2px 8px rgba(15, 23, 42, .18);
}
pre code { background: none; color: inherit; padding: 0; font-size: .875rem; }
blockquote {
  border-left: 4px solid #f59e0b;
  background: linear-gradient(90deg, #fffbeb, #fffdf5);
  margin: 1.1rem 0;
  padding: .7rem 1.1rem;
  border-radius: 0 10px 10px 0;
  color: #713f12;
  box-shadow: 0 1px 3px rgba(120, 80, 0, .06);
}
blockquote p { margin: .25rem 0; }
blockquote code { background: #fef3c7; color: #92400e; }
ul, ol { padding-left: 1.6rem; margin: .5rem 0 1rem; }
li { margin: .28rem 0; }
li::marker { color: #2563eb; font-weight: 700; }
hr {
  border: none;
  height: 1px;
  background: linear-gradient(90deg, #c7dbf5, #e6edf5 60%, transparent);
  margin: 2.4rem 0;
}
img { max-width: 100%; border-radius: 8px; }
@media (prefers-color-scheme: dark) {
  body { color: #d7e0ea; background: #0d1526; }
  h1 { color: #e8f0fb; }
  h2, h3 { color: #93b4f5; }
  strong { color: #eaf2ff; }
  a { color: #7ab3ff; border-bottom-color: #29426e; }
  a:hover { background: #14213c; }
  table { background: #101b31; border-color: #24365a; box-shadow: none; }
  th { background: #16243c; color: #a9c6f8; border-bottom-color: #2c4470; }
  th, td { border-bottom-color: #1d2f4f; }
  tbody tr:nth-child(even) td { background: #0f1a2f; }
  tbody tr:hover td { background: #16243c; }
  code { background: #1a2a4a; color: #9ec1ff; }
  blockquote { background: #201a0b; border-left-color: #b45309; color: #e7c98a; }
  blockquote code { background: #3a2c10; color: #f5d488; }
  hr { background: linear-gradient(90deg, #24365a, transparent); }
}
@media print {
  body { background: #fff; max-width: none; padding: 0; font-size: 12pt; }
  table, pre, blockquote { box-shadow: none; break-inside: avoid; }
  pre { background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; }
  pre code { color: inherit; }
  a { border-bottom: none; color: #1d4ed8; }
}`;

/** 防斷處理：外部 CSS 含 </style> 時避免提前終結樣式區塊 */
export function sanitizeCss(css: string): string {
  return css.replace(/<\/style/gi, '<\\/style');
}

/**
 * 解析文件適用的主題 CSS。
 * 自 `docFsPath` 所在目錄向上查找 `.kiro/assets/doc-style.css`：
 * 找到 → 回傳檔案內容（完整取代內建）；找不到／讀取失敗 → 回傳 DEFAULT_THEME_CSS。
 *
 * @param docFsPath   文件絕對路徑
 * @param stopAtFsPath 查找邊界（含），通常為 workspace folder 根；未提供時以 MAX_ASCEND 層為限
 */
export function resolveThemeCss(docFsPath: string, stopAtFsPath?: string): string {
  try {
    let dir = path.dirname(path.resolve(docFsPath));
    const stop = stopAtFsPath ? path.resolve(stopAtFsPath) : undefined;
    for (let i = 0; i < MAX_ASCEND; i++) {
      const candidate = path.join(dir, THEME_FILE_RELPATH);
      if (fs.existsSync(candidate)) {
        return sanitizeCss(fs.readFileSync(candidate, 'utf-8'));
      }
      if (stop && dir === stop) break;
      const parent = path.dirname(dir);
      if (parent === dir) break; // 已達磁碟根
      dir = parent;
    }
  } catch (err) {
    console.warn('[HTML-Editor] resolveThemeCss fallback to default theme:', err);
  }
  return DEFAULT_THEME_CSS;
}

/**
 * 將 body fragment 包裝為完整 HTML 文件並注入主題樣式。
 * 內容已是完整文件（`<!doctype` / `<html` 開頭）時維持原樣回傳（不重複包裝、不注入）。
 *
 * 兩種情形都補上表格標頭語意（spec: .kiro/spec/table-header/）：Quill 表格只有 td，
 * 於此升級為 `thead > th`，主題的表頭樣式才選得到元素。save 與 exportHtml 兩條
 * 匯出路徑均經此函式，故無須各自處理。
 *
 * ⚠️ 完整文件分支也必須處理：Webview 送出的 `sourceArea.value` 幾乎都是完整文件
 * （`.html` 原檔本身即完整文件，`.md` 則由 markdownToHtml 產生），只處理 fragment
 * 分支等同完全不生效。此分支僅改寫表格，不重複包裝、不注入樣式。
 */
export function buildHtmlDocument(content: string, title: string, css: string): string {
  const trimmed = content.trimStart().toLowerCase();
  if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')) {
    return promoteTableHeaders(content);
  }

  const body = promoteTableHeaders(content);

  return `<!DOCTYPE html>\n<html lang="zh-TW">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${title}</title>\n  <style>\n${css}\n  </style>\n</head>\n<body>\n${body}\n</body>\n</html>`;
}

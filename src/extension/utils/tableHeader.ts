import { defaultTreeAdapter, parse, parseFragment, serialize } from 'parse5';

/**
 * tableHeader.ts — 表格標頭語意化（spec: .kiro/spec/table-header/）
 *
 * Quill 內建 table 模組只產生 `<tbody><tr><td>`，不含 `<thead>` / `<th>`，
 * 導致匯出檔套不到主題的表頭樣式（theme.ts 的 `th` 選擇器），第一列與資料列長得一樣。
 * 本模組於「匯出 / 轉 Markdown」階段補上語意：第一列的 `td` → `thead > th`。
 *
 * 設計要點：
 *   - 冪等：已有 `thead` 或已有 `th` 的表格不做二次處理（Markdown 經 marked 產生者走此分支）
 *   - 保守：無表格、或無任何表格被修改時，原字串回傳（不讓 parse5 正規化動到既有 HTML）
 *   - 巢狀表格各自處理：列的蒐集只看 table 的直接結構，不深度走訪
 *   - fragment 與完整 HTML 文件皆支援：Webview 送出的 `sourceArea.value` 通常是含
 *     `<!DOCTYPE>` / `<head>` 的完整文件，此時必須用 `parse()`；誤用 `parseFragment()`
 *     會使 doctype 與 html/head/body 標籤在序列化時消失。
 */

/** parse5 節點的最小結構（避免綁定 parse5 型別匯出路徑） */
interface P5Node {
  nodeName: string;
  tagName?: string;
  namespaceURI?: string;
  attrs?: { name: string; value: string }[];
  childNodes?: P5Node[];
  parentNode?: P5Node | null;
}

export interface PromoteOptions {
  /** 列數少於此值的表格不升級（避免整張表變成標頭）。預設 2 */
  minRows?: number;
}

/** table 的直接列容器 */
const ROW_CONTAINERS = new Set(['tbody', 'tfoot']);

const XHTML_NS = 'http://www.w3.org/1999/xhtml';

/** 內容是否為完整 HTML 文件（與 theme.ts buildHtmlDocument 的判斷一致） */
function isFullDocument(html: string): boolean {
  const head = html.trimStart().toLowerCase();
  return head.startsWith('<!doctype') || head.startsWith('<html');
}

/**
 * 將 HTML 中每個 `<table>` 第一列的 `<td>` 升級為 `<thead><th scope="col">`。
 * 儲存格既有屬性（`data-row`、`colspan`、`style` 等）與內層 HTML 完整保留。
 * body fragment 與完整 HTML 文件皆可傳入（後者的 doctype / head / style 原樣保留）。
 *
 * @param html 要處理的 HTML
 * @param opts `minRows` — 少於此列數不升級，預設 2
 */
export function promoteTableHeaders(html: string, opts: PromoteOptions = {}): string {
  const minRows = opts.minRows ?? 2;
  return transformTables(html, /<table[\s>]/i, (table) => promoteTable(table, minRows));
}

/**
 * 反向操作：`thead > th` 降級為 `tbody > td`，供**載入編輯器**使用。
 *
 * Quill 的 table 模組只註冊 TD / TR / TBODY / TABLE 四種 blot（無 TH / THEAD），
 * 含 `thead` 的表格被 `dangerouslyPasteHTML()` 載入時，表頭整列會被壓成單一區塊。
 * 故送進 Webview 前先降級，存檔／轉存時再由 `promoteTableHeaders()` 升級回來。
 */
export function demoteTableHeaders(html: string): string {
  return transformTables(html, /<t(head|h)[\s>]/i, demoteTable);
}

/**
 * 共用骨架：解析 → 逐一 table 套用 `mutate` → 有改動才序列化。
 * `guard` 為快速路徑判斷（不符即原樣回傳，避免無謂的 parse / serialize）。
 */
function transformTables(
  html: string,
  guard: RegExp,
  mutate: (table: P5Node) => boolean
): string {
  if (!html || !guard.test(html)) return html;

  let root: P5Node;
  try {
    root = (isFullDocument(html) ? parse(html) : parseFragment(html)) as unknown as P5Node;
  } catch (err) {
    console.warn('[HTML-Editor] tableHeader parse failed, HTML kept as-is:', err);
    return html;
  }

  let changed = false;
  for (const table of collectTables(root)) {
    if (mutate(table)) changed = true;
  }

  // 沒有任何表格被改動 → 回傳原字串，避免 parse5 重新序列化造成非預期差異
  if (!changed) return html;

  try {
    return serialize(root as any);
  } catch (err) {
    console.warn('[HTML-Editor] tableHeader serialize failed, HTML kept as-is:', err);
    return html;
  }
}

/** 深度走訪蒐集所有 table 元素（巢狀表格亦各自納入） */
function collectTables(root: P5Node): P5Node[] {
  const tables: P5Node[] = [];
  const stack: P5Node[] = [...(root.childNodes ?? [])];
  while (stack.length) {
    const node = stack.pop()!;
    if (node.nodeName === 'table') tables.push(node);
    if (node.childNodes?.length) stack.push(...node.childNodes);
  }
  return tables;
}

/**
 * 處理單一 table，回傳是否有改動。
 * 跳過條件：已有 thead／任一列已含 th／列數不足／第一列無儲存格。
 */
function promoteTable(table: P5Node, minRows: number): boolean {
  const children = table.childNodes ?? [];
  if (children.some((c) => c.nodeName === 'thead')) return false;

  const rows = collectRows(children);
  if (rows.length < minRows) return false;
  if (rows.some((row) => cellsOf(row).some((cell) => cell.nodeName === 'th'))) return false;

  const headerRow = rows[0];
  const cells = cellsOf(headerRow);
  if (cells.length === 0) return false;

  // td → th（原地改名，屬性與子節點全數保留）
  for (const cell of cells) {
    cell.nodeName = 'th';
    cell.tagName = 'th';
    cell.attrs = cell.attrs ?? [];
    if (!cell.attrs.some((a) => a.name === 'scope')) {
      cell.attrs.push({ name: 'scope', value: 'col' });
    }
  }

  // 將標頭列搬進新建的 thead，thead 置於 table 第一個子節點
  const parent = headerRow.parentNode;
  if (parent?.childNodes) {
    parent.childNodes = parent.childNodes.filter((n) => n !== headerRow);
  }

  const thead = defaultTreeAdapter.createElement(
    'thead',
    (table.namespaceURI ?? XHTML_NS) as any,
    []
  ) as unknown as P5Node;
  thead.parentNode = table;
  thead.childNodes = [headerRow];
  headerRow.parentNode = thead;
  table.childNodes = [thead, ...children];

  // 標頭列搬離後留下的空 tbody / tfoot 一併移除
  table.childNodes = table.childNodes.filter(
    (n) => !(ROW_CONTAINERS.has(n.nodeName) && (n.childNodes?.length ?? 0) === 0)
  );

  return true;
}

/**
 * 單一 table 的降級：thead 內的列併回 tbody 最前面，所有 th 改回 td（移除 scope）。
 * 回傳是否有改動。
 */
function demoteTable(table: P5Node): boolean {
  const children = table.childNodes ?? [];
  const theads = children.filter((c) => c.nodeName === 'thead');
  const headerRows: P5Node[] = [];

  for (const thead of theads) {
    for (const row of thead.childNodes ?? []) {
      if (row.nodeName === 'tr') headerRows.push(row);
    }
  }

  // 散落在 tbody / tfoot / 直接子 tr 內的 th 也一併降級
  const strayTh = collectRows(children).flatMap((row) =>
    cellsOf(row).filter((cell) => cell.nodeName === 'th')
  );

  if (theads.length === 0 && strayTh.length === 0) return false;

  for (const cell of [...headerRows.flatMap(cellsOf), ...strayTh]) {
    cell.nodeName = 'td';
    cell.tagName = 'td';
    cell.attrs = (cell.attrs ?? []).filter((a) => a.name !== 'scope');
  }

  if (theads.length === 0) return true;

  // thead 移除，其列插到第一個 tbody 最前面（沒有 tbody 就新建一個）
  let tbody = children.find((c) => c.nodeName === 'tbody');
  const rest = children.filter((c) => c.nodeName !== 'thead');

  if (!tbody) {
    tbody = defaultTreeAdapter.createElement(
      'tbody',
      (table.namespaceURI ?? XHTML_NS) as any,
      []
    ) as unknown as P5Node;
    tbody.parentNode = table;
    tbody.childNodes = [];
    rest.unshift(tbody);
  }

  tbody.childNodes = [...headerRows, ...(tbody.childNodes ?? [])];
  for (const row of headerRows) row.parentNode = tbody;
  table.childNodes = rest;

  return true;
}

/** 取得 table 直接結構下的列（tr 直接子節點，或 tbody / tfoot 內的 tr） */
function collectRows(children: P5Node[]): P5Node[] {
  const rows: P5Node[] = [];
  for (const child of children) {
    if (child.nodeName === 'tr') {
      rows.push(child);
    } else if (ROW_CONTAINERS.has(child.nodeName)) {
      for (const row of child.childNodes ?? []) {
        if (row.nodeName === 'tr') rows.push(row);
      }
    }
  }
  return rows;
}

/** 取得列中的儲存格（td / th） */
function cellsOf(row: P5Node): P5Node[] {
  return (row.childNodes ?? []).filter((n) => n.nodeName === 'td' || n.nodeName === 'th');
}

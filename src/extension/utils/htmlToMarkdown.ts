import TurndownService from 'turndown';
// turndown-plugin-gfm 未提供型別定義（registry 無對應 @types 套件），以 require 取用並就地標註型別
const { tables } = require('turndown-plugin-gfm') as { tables: (service: TurndownService) => void };
import { promoteTableHeaders } from './tableHeader';

const td = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  bulletListMarker: '-',
});

// GFM 表格規則（spec: .kiro/spec/table-header/）：僅取 tables，
// 不引入 strikethrough / taskListItems 以免改動既有輸出。
td.use(tables);

// 非內文節點：save 時傳入的是「已包主題 <style> 的完整文件」，未移除會把整份 CSS
// 與標題文字寫進 .md。turndown 以 div.innerHTML 解析，<head> 標籤本身已消失、
// 但 <title> / <style> 元素會殘留，故必須逐一列名（remove(['head']) 無效）。
td.remove(['style', 'script', 'title', 'meta', 'link']);

export function htmlToMarkdown(html: string): string {
  // GFM 表格語法必須有標頭列，否則產不出合法的 | --- | 分隔列；
  // minRows: 1 讓單列表格也取得標頭，確保輸出永遠是合法 GFM 表格。
  const normalized = promoteTableHeaders(html, { minRows: 1 });

  return td.turndown(normalized)
    .replace(/^(\s*)-\s{2,}/gm, '$1- ')
    .replace(/^(\s*)(\d+\.)\s{2,}/gm, '$1$2 ');
}

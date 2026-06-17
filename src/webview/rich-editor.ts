import Quill from 'quill';
// @ts-ignore
import quillCss from 'quill/dist/quill.snow.css';

declare const acquireVsCodeApi: () => { postMessage: (msg: unknown) => void; };

// ── Inject Quill CSS ─────────────────────────────────────────────────────────
const styleEl = document.createElement('style');
styleEl.textContent = quillCss as string;
document.head.appendChild(styleEl);

// ── Allow relative URLs in Quill links ───────────────────────────────────────
const Link = Quill.import('formats/link') as any;
const _sanitize = Link.sanitize.bind(Link);
Link.sanitize = (url: string) => {
  if (!url || url.startsWith('#') || url.startsWith('.') || url.startsWith('/') || url.startsWith('data:')) return url;
  return _sanitize(url);
};

// ── Allow relative URLs in Quill images ──────────────────────────────────────
// Quill's Image blot sanitizes src and replaces relative paths with `//:0`.
// Allow relative/local paths (no ://) and special URLs (data:, anchors).
const ImageBlot = Quill.import('formats/image') as any;
const _imgSanitize = ImageBlot.sanitize.bind(ImageBlot);
ImageBlot.sanitize = (url: string) => {
  // Allow: empty, data URIs, anchors, or relative/local paths (no ://)
  if (!url || url.startsWith('data:') || url.startsWith('#') || !url.includes('://')) {
    return url;
  }
  // For external URLs with protocol, use original sanitizer
  return _imgSanitize(url);
};

const vscode = acquireVsCodeApi();

// ── DOM refs ─────────────────────────────────────────────────────────────────
const saveBtn        = document.getElementById('saveBtn')!;
const statusEl       = document.getElementById('status')!;
const sourceArea     = document.getElementById('sourceArea') as HTMLTextAreaElement;
const preview        = document.getElementById('preview') as HTMLIFrameElement;
const editorWrap     = document.getElementById('editorWrap')!;
const rightLabel     = document.getElementById('rightLabel')!;
const btnRich        = document.getElementById('btnRich')!;
const btnPreview     = document.getElementById('btnPreview')!;
// Table controls
const tableBar       = document.getElementById('tableBar')!;
const tblInsert      = document.getElementById('tblInsert')!;
const tblRowAbove    = document.getElementById('tblRowAbove')!;
const tblRowBelow    = document.getElementById('tblRowBelow')!;
const tblColLeft     = document.getElementById('tblColLeft')!;
const tblColRight    = document.getElementById('tblColRight')!;
const tblDelRow      = document.getElementById('tblDelRow')!;
const tblDelCol      = document.getElementById('tblDelCol')!;
const tblDelTable    = document.getElementById('tblDelTable')!;
const tablePopover   = document.getElementById('tablePopover')!;
const tblRowsInput   = document.getElementById('tblRows') as HTMLInputElement;
const tblColsInput   = document.getElementById('tblCols') as HTMLInputElement;
const tblConfirm     = document.getElementById('tblConfirm')!;
const tblCancel      = document.getElementById('tblCancel')!;
// Font zoom
const zoomInBtn      = document.getElementById('zoomIn')!;
const zoomOutBtn     = document.getElementById('zoomOut')!;
const zoomLabel      = document.getElementById('zoomLabel')!;
// Panel-width presets
const panelLeft        = document.getElementById('panelLeft')! as HTMLElement;
const resizer          = document.getElementById('resizer')! as HTMLElement;
const splitEl          = document.getElementById('split')! as HTMLElement;
const winNarrow        = document.getElementById('winNarrow')!;
const winHalf          = document.getElementById('winHalf')!;
const winWide          = document.getElementById('winWide')!;
const toggleSourceBtn  = document.getElementById('toggleSourceBtn') as HTMLButtonElement | null;
// Left search
const searchLeftBar   = document.getElementById('searchLeft')!;
const searchLeftInput = document.getElementById('searchLeftInput') as HTMLInputElement;
const searchLeftCount = document.getElementById('searchLeftCount')!;
const searchLeftPrev  = document.getElementById('searchLeftPrev')!;
const searchLeftNext  = document.getElementById('searchLeftNext')!;
const searchLeftClose = document.getElementById('searchLeftClose')!;
const searchLeftBtn   = document.getElementById('searchLeftBtn')!;
// Left replace
const searchLeftReplace     = document.getElementById('searchLeftReplace') as HTMLInputElement;
const searchLeftReplaceOne  = document.getElementById('searchLeftReplaceOne')!;
const searchLeftReplaceAll  = document.getElementById('searchLeftReplaceAll')!;
// Right search
const searchRightBar   = document.getElementById('searchRight')!;
const searchRightInput = document.getElementById('searchRightInput') as HTMLInputElement;
const searchRightCount = document.getElementById('searchRightCount')!;
const searchRightPrev  = document.getElementById('searchRightPrev')!;
const searchRightNext  = document.getElementById('searchRightNext')!;
const searchRightClose = document.getElementById('searchRightClose')!;
const searchRightBtn   = document.getElementById('searchRightBtn')!;

// ── State ─────────────────────────────────────────────────────────────────────
let richMode   = true;   // Rich Editor is the default right-panel view
let isDirty    = false;
let previewTimer: ReturnType<typeof setTimeout> | null = null;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let syncing    = false;  // Guard against source ↔ Quill update feedback loop
let fontSize   = 13;

// ── Quill ─────────────────────────────────────────────────────────────────────
const quill = new Quill('#editor', {
  theme: 'snow',
  placeholder: '開始輸入內容...',
  modules: {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ font: [] }],
        [{ size: ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ script: 'sub' }, { script: 'super' }],
        [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ align: [] }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean'],
      ],
      handlers: {
        image: () => {
          vscode.postMessage({ type: 'attachFile', context: 'image' });
          setStatus('⏳ 選擇圖片中...');
        },
      },
    },
    history: { delay: 1000, maxStack: 500, userOnly: true },
    table: true,  // Enable Quill's built-in table module
  },
});

const tableModule = quill.getModule('table') as any;

// ── Image resize on double-click ──────────────────────────────────────────────
let resizeTargetImg: HTMLImageElement | null = null;
quill.root.addEventListener('dblclick', (e: Event) => {
  const img = (e.target as Element | null)?.closest('img') as HTMLImageElement | null;
  if (!img) return;
  resizeTargetImg = img;
  const currentWidth = img.style.width || img.getAttribute('width') || '';
  // VS Code webviews block native prompt(); ask the host for an input box.
  vscode.postMessage({
    type: 'inputBox',
    payload: {
      purpose: 'imageWidth',
      value: currentWidth,
      prompt: '設定圖片寬度（如 400 表示 400px，留空恢復原始大小）',
      placeHolder: '400 或 50%',
    },
  });
});

function applyImageWidth(width: string) {
  if (!resizeTargetImg) return;
  if (width.trim()) {
    const val = width.trim();
    resizeTargetImg.style.width = val.includes('px') || val.includes('%') ? val : `${val}px`;
    resizeTargetImg.style.height = 'auto';
  } else {
    resizeTargetImg.style.width = '';
    resizeTargetImg.style.height = '';
  }
  // Sync the change back to source/preview
  syncing = true;
  sourceArea.value = getRichHtml();
  syncing = false;
  schedulePreview();
  isDirty = true;
  setStatus('● 未保存');
  resizeTargetImg = null;
}

// ── Table editing ─────────────────────────────────────────────────────────────
// Quill's table methods bail out when getSelection() is null. Opening a prompt()
// blurs the editor and clears the selection, so we track the last known caret
// position and restore it (with focus) before running any table operation.
let lastRange: { index: number; length: number } | null = null;
quill.on('selection-change', (range) => {
  if (range) lastRange = range;
});

// Restore a valid selection. `fallbackToEnd` is used by insertTable so a table
// can be added even when the editor was never clicked.
function restoreSelection(fallbackToEnd: boolean): boolean {
  let range = quill.getSelection() || lastRange;
  if (range == null && fallbackToEnd) {
    range = { index: Math.max(0, quill.getLength() - 1), length: 0 };
  }
  if (range == null) return false;
  quill.focus();
  quill.setSelection(range.index, range.length, 'silent');
  return true;
}

function tableOp(fn: () => void, fallbackToEnd: boolean) {
  if (!restoreSelection(fallbackToEnd)) {
    setStatus('⚠ 請先將游標移入表格儲存格');
    return;
  }
  try {
    fn();
  } catch (err) {
    setStatus('⚠ 表格操作失敗，請將游標移入儲存格');
    return;
  }
  // Sync the resulting table HTML back to source/preview
  syncing = true;
  sourceArea.value = getRichHtml();
  syncing = false;
  schedulePreview();
  isDirty = true;
  setStatus('● 未保存');
}

// Show an inline popover inside the editor (VS Code webviews block prompt()).
tblInsert.addEventListener('click', () => {
  // Capture caret before the popover takes focus.
  const preRange = quill.getSelection() || lastRange;
  if (preRange) lastRange = preRange;
  const showing = tablePopover.classList.toggle('show');
  if (showing) { tblRowsInput.focus(); tblRowsInput.select(); }
});

function closeTablePopover() {
  tablePopover.classList.remove('show');
}

function confirmInsertTable() {
  const rows = Math.min(20, Math.max(1, parseInt(tblRowsInput.value, 10) || 3));
  const cols = Math.min(20, Math.max(1, parseInt(tblColsInput.value, 10) || 3));
  closeTablePopover();
  tableOp(() => tableModule.insertTable(rows, cols), true);
}

tblConfirm.addEventListener('click', confirmInsertTable);
tblCancel.addEventListener('click', closeTablePopover);
[tblRowsInput, tblColsInput].forEach((el) => {
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); confirmInsertTable(); }
    if (e.key === 'Escape') { e.preventDefault(); closeTablePopover(); }
  });
});

tblRowAbove.addEventListener('click', () => tableOp(() => tableModule.insertRowAbove(), false));
tblRowBelow.addEventListener('click', () => tableOp(() => tableModule.insertRowBelow(), false));
tblColLeft.addEventListener('click',  () => tableOp(() => tableModule.insertColumnLeft(), false));
tblColRight.addEventListener('click', () => tableOp(() => tableModule.insertColumnRight(), false));
tblDelRow.addEventListener('click',   () => tableOp(() => tableModule.deleteRow(), false));
tblDelCol.addEventListener('click',   () => tableOp(() => tableModule.deleteColumn(), false));
tblDelTable.addEventListener('click', () => tableOp(() => tableModule.deleteTable(), false));

// ── Helpers ───────────────────────────────────────────────────────────────────
function setStatus(msg: string, ok?: boolean) {
  statusEl.textContent = msg;
  statusEl.className = 'status' + (ok === true ? ' saved' : ok === false ? ' error' : '');
}

function getRichHtml(): string {
  return typeof (quill as any).getSemanticHTML === 'function'
    ? (quill as any).getSemanticHTML()
    : quill.root.innerHTML;
}

function wrapHtml(body: string): string {
  return `<!DOCTYPE html><html lang="zh-TW">
<head><meta charset="UTF-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         max-width: 900px; margin: 24px auto; padding: 0 20px; line-height: 1.8; color: #1a1a1a; }
  h1,h2,h3 { border-bottom: 1px solid #e0e0e0; padding-bottom: 6px; margin: 20px 0 10px; }
  code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; font-size: .9em; }
  pre  { background: #f4f4f4; padding: 16px; overflow-x: auto; border-radius: 4px; }
  blockquote { border-left: 4px solid #667eea; margin: 0; padding-left: 16px; color: #555; }
  table { border-collapse: collapse; width: 100%; }
  th,td { border: 1px solid #ddd; padding: 8px 12px; }
  th { background: #f8f8f8; }
  img { max-width: 100%; }
  a { color: #667eea; cursor: pointer; }
</style>
</head><body>${body}</body></html>`;
}

// ── Load HTML ─────────────────────────────────────────────────────────────────
function loadHtml(html: string) {
  sourceArea.value = html;
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const inner = bodyMatch ? bodyMatch[1].trim() : html;
  quill.clipboard.dangerouslyPasteHTML(inner);
  if (!richMode) refreshPreview();
  isDirty = false;
  setStatus('');
}

// ── Preview sync ──────────────────────────────────────────────────────────────
function schedulePreview() {
  if (previewTimer) clearTimeout(previewTimer);
  previewTimer = setTimeout(refreshPreview, 350);
}

function refreshPreview() {
  const raw = sourceArea.value;
  const full = /^\s*<!DOCTYPE/i.test(raw) || /^\s*<html/i.test(raw);
  const html = full ? raw : wrapHtml(raw);

  // Convert relative image paths to webview URIs for preview display
  vscode.postMessage({ type: 'convertImagePaths', payload: { html } });
}

preview.addEventListener('load', () => {
  attachLinkInterceptor();
  // Re-run preview search highlights if search is open
  if (searchRightBar.style.display !== 'none' && !richMode && searchRightInput.value) {
    doSearchRight();
  }
});

function attachLinkInterceptor() {
  try {
    const doc = preview.contentDocument;
    if (!doc) return;
    doc.addEventListener('click', (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest('a') as HTMLAnchorElement | null;
      if (!a) return;
      const raw = a.getAttribute('href') || '';
      if (!raw || raw.startsWith('#')) return;
      e.preventDefault();
      vscode.postMessage({ type: 'openLink', raw });
    });
  } catch (_) {}
}

// ── Right panel: Rich ↔ Preview toggle ───────────────────────────────────────
function setRichMode(rich: boolean) {
  richMode = rich;
  if (rich) {
    editorWrap.style.display = 'flex';
    preview.style.display    = 'none';
    tableBar.style.display   = 'flex';
    rightLabel.textContent   = 'Rich Text Editor';
    btnRich.classList.add('active');
    btnPreview.classList.remove('active');
    // Sync source → Quill
    syncing = true;
    const bodyMatch = sourceArea.value.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const inner = bodyMatch ? bodyMatch[1].trim() : sourceArea.value;
    quill.clipboard.dangerouslyPasteHTML(inner);
    syncing = false;
  } else {
    editorWrap.style.display = 'none';
    preview.style.display    = 'block';
    tableBar.style.display   = 'none';
    rightLabel.textContent   = 'Live Preview';
    btnRich.classList.remove('active');
    btnPreview.classList.add('active');
    refreshPreview();
  }
  // Close right search when switching modes
  closeSearchRight();
}

btnRich.addEventListener('click',    () => setRichMode(true));
btnPreview.addEventListener('click', () => setRichMode(false));

// ── Font zoom ─────────────────────────────────────────────────────────────────
function applyZoom() {
  sourceArea.style.fontSize = `${fontSize}px`;
  zoomLabel.textContent = `${fontSize}px`;
}
zoomInBtn.addEventListener('click',  () => { if (fontSize < 28) { fontSize++; applyZoom(); } });
zoomOutBtn.addEventListener('click', () => { if (fontSize > 10) { fontSize--; applyZoom(); } });

// ── Panel-width presets ───────────────────────────────────────────────────────
function setPanelWidth(pct: number) {
  panelLeft.style.flex = `0 0 ${pct}%`;
  [winNarrow, winHalf, winWide].forEach(b => b.classList.remove('active'));
  if (pct === 30) winNarrow.classList.add('active');
  else if (pct === 50) winHalf.classList.add('active');
  else if (pct === 70) winWide.classList.add('active');
}
winNarrow.addEventListener('click', () => setPanelWidth(30));
winHalf.addEventListener('click',   () => setPanelWidth(50));
winWide.addEventListener('click',   () => setPanelWidth(70));

// ── Toggle source panel collapse ──────────────────────────────────────────────
let sourceCollapsed = false;
let lastSourceWidth = '30%';

if (toggleSourceBtn) {
  toggleSourceBtn.addEventListener('click', () => {
    if (!sourceCollapsed) {
      lastSourceWidth = panelLeft.style.flexBasis || panelLeft.style.flex.split(' ')[2] || '30%';
      panelLeft.classList.add('collapsed');
      toggleSourceBtn.textContent = '▶ 展開原始碼';
      sourceCollapsed = true;
    } else {
      panelLeft.classList.remove('collapsed');
      panelLeft.style.flex = `0 0 ${lastSourceWidth}`;
      toggleSourceBtn.textContent = '◀ 收闔原始碼';
      sourceCollapsed = false;
    }
  });
}

// ── Drag-to-resize ────────────────────────────────────────────────────────────
let dragging = false, dragStartX = 0, dragStartWidth = 0;
resizer.addEventListener('mousedown', (e) => {
  dragging = true;
  dragStartX = e.clientX;
  dragStartWidth = panelLeft.getBoundingClientRect().width;
  resizer.classList.add('dragging');
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  preview.style.pointerEvents = 'none';
});
document.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  const total = splitEl.getBoundingClientRect().width;
  const pct = Math.min(90, Math.max(10, ((dragStartWidth + e.clientX - dragStartX) / total) * 100));
  panelLeft.style.flex = `0 0 ${pct.toFixed(1)}%`;
});
document.addEventListener('mouseup', () => {
  if (!dragging) return;
  dragging = false;
  resizer.classList.remove('dragging');
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  preview.style.pointerEvents = '';
});

// ── Dirty tracking ────────────────────────────────────────────────────────────
sourceArea.addEventListener('input', () => {
  if (!isDirty) { isDirty = true; setStatus('● 未保存'); }
  schedulePreview();
  scheduleSourceToQuill();
});

// Sync source → Quill (debounced) so editing HTML updates the rich editor live.
function scheduleSourceToQuill() {
  if (!richMode || syncing) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncing = true;
    const sel = quill.getSelection();
    const bodyMatch = sourceArea.value.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const inner = bodyMatch ? bodyMatch[1].trim() : sourceArea.value;
    quill.clipboard.dangerouslyPasteHTML(inner);
    if (sel) {
      const len = quill.getLength();
      quill.setSelection(Math.min(sel.index, len - 1), 0, 'silent');
    }
    syncing = false;
  }, 300);
}
sourceArea.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const s = sourceArea.selectionStart, end = sourceArea.selectionEnd;
    sourceArea.value = sourceArea.value.slice(0, s) + '  ' + sourceArea.value.slice(end);
    sourceArea.selectionStart = sourceArea.selectionEnd = s + 2;
    schedulePreview();
  }
});
quill.on('text-change', () => {
  if (!richMode) return;
  if (syncing) return;  // Skip when the change originates from a source → Quill sync
  if (!isDirty) { isDirty = true; setStatus('● 未保存'); }
  syncing = true;
  sourceArea.value = getRichHtml();
  syncing = false;
  schedulePreview();
});

// ── Save ──────────────────────────────────────────────────────────────────────
function save() {
  vscode.postMessage({ type: 'save', payload: { html: sourceArea.value } });
  setStatus('⏳ 保存中...');
}
saveBtn.addEventListener('click', save);

// ── File attachment ───────────────────────────────────────────────────────────
function insertAttachment(payload: { htmlFragment: string; filename: string; relPath: string; mode?: string }) {
  if (payload.mode === 'image') {
    // For images: request webview URI from Extension Host so Quill/preview can display them.
    // sourceArea keeps relative path (for saving), Quill uses webview URI (for display).
    vscode.postMessage({ type: 'resolveImage', payload: { relPath: payload.relPath } });
  } else {
    // Non-image: insert HTML fragment at the textarea cursor.
    const pos    = sourceArea.selectionStart ?? sourceArea.value.length;
    const before = sourceArea.value.slice(0, pos);
    const after  = sourceArea.value.slice(pos);
    sourceArea.value = before + '\n' + payload.htmlFragment + '\n' + after;
    schedulePreview();
    isDirty = true;
    setStatus(`📎 已附加 ${payload.filename}`);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ── LEFT SEARCH (Source Code textarea) ──────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════
let leftMatches: Array<{start: number; end: number}> = [];
let leftIdx = -1;

function openSearchLeft() {
  searchLeftBar.style.display = 'flex';
  searchLeftInput.focus();
  searchLeftInput.select();
  runSearchLeft();
}
function closeSearchLeft() {
  searchLeftBar.style.display = 'none';
  leftMatches = [];
  leftIdx = -1;
  searchLeftCount.textContent = '';
  searchLeftInput.classList.remove('no-match');
}
function runSearchLeft() {
  const q = searchLeftInput.value;
  leftMatches = [];
  leftIdx = -1;
  searchLeftInput.classList.remove('no-match');
  if (!q) { searchLeftCount.textContent = ''; return; }
  const text  = sourceArea.value;
  const lower = text.toLowerCase();
  const ql    = q.toLowerCase();
  let pos = 0;
  while ((pos = lower.indexOf(ql, pos)) !== -1) {
    leftMatches.push({ start: pos, end: pos + q.length });
    pos += q.length;
  }
  if (leftMatches.length === 0) {
    searchLeftCount.textContent = '無結果';
    searchLeftInput.classList.add('no-match');
  } else {
    navigateLeft(0);
  }
}
function navigateLeft(idx: number) {
  if (!leftMatches.length) return;
  leftIdx = ((idx % leftMatches.length) + leftMatches.length) % leftMatches.length;
  const m = leftMatches[leftIdx];
  sourceArea.focus();
  sourceArea.setSelectionRange(m.start, m.end);
  const linesBefore = sourceArea.value.substring(0, m.start).split('\n').length;
  const lineH = parseInt(getComputedStyle(sourceArea).lineHeight) || 20;
  sourceArea.scrollTop = Math.max(0, (linesBefore - 4) * lineH);
  searchLeftCount.textContent = `${leftIdx + 1} / ${leftMatches.length}`;
}

function replaceLeftOne() {
  const q = searchLeftInput.value;
  const r = searchLeftReplace.value;
  if (!q || leftMatches.length === 0 || leftIdx < 0) return;
  const m = leftMatches[leftIdx];
  const before = sourceArea.value.substring(0, m.start);
  const after  = sourceArea.value.substring(m.end);
  sourceArea.value = before + r + after;
  if (!isDirty) { isDirty = true; setStatus('● 未保存'); }
  const offset = r.length - q.length;
  for (let i = leftIdx + 1; i < leftMatches.length; i++) {
    leftMatches[i].start += offset;
    leftMatches[i].end += offset;
  }
  leftMatches.splice(leftIdx, 1);
  if (leftMatches.length === 0) {
    searchLeftCount.textContent = '無結果';
    searchLeftInput.classList.add('no-match');
  } else {
    navigateLeft(Math.min(leftIdx, leftMatches.length - 1));
  }
  scheduleSourceToQuill();
  schedulePreview();
}

function replaceLeftAll() {
  const q = searchLeftInput.value;
  const r = searchLeftReplace.value;
  if (!q || leftMatches.length === 0) return;
  const count = leftMatches.length;
  for (let i = leftMatches.length - 1; i >= 0; i--) {
    const m = leftMatches[i];
    const before = sourceArea.value.substring(0, m.start);
    const after  = sourceArea.value.substring(m.end);
    sourceArea.value = before + r + after;
  }
  if (!isDirty) { isDirty = true; setStatus('● 未保存'); }
  leftMatches = [];
  leftIdx = -1;
  searchLeftCount.textContent = `已替換 ${count} 個`;
  searchLeftInput.classList.remove('no-match');
  scheduleSourceToQuill();
  schedulePreview();
}

searchLeftBtn.addEventListener('click', openSearchLeft);
searchLeftInput.addEventListener('input', runSearchLeft);
searchLeftNext.addEventListener('click', () => navigateLeft(leftIdx + 1));
searchLeftPrev.addEventListener('click', () => navigateLeft(leftIdx - 1));
searchLeftClose.addEventListener('click', closeSearchLeft);
searchLeftInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); navigateLeft(e.shiftKey ? leftIdx - 1 : leftIdx + 1); }
  if (e.key === 'Escape') closeSearchLeft();
});
searchLeftReplaceOne.addEventListener('click', replaceLeftOne);
searchLeftReplaceAll.addEventListener('click', replaceLeftAll);
searchLeftReplace.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); replaceLeftOne(); }
});

// ════════════════════════════════════════════════════════════════════════════
// ── RIGHT SEARCH (Rich Editor / Preview) ────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════
let rightQuillMatches: number[] = [];  // Quill char positions
let rightQuillLen = 0;
let rightIdx = -1;

function openSearchRight() {
  searchRightBar.style.display = 'flex';
  searchRightInput.focus();
  searchRightInput.select();
  doSearchRight();
}
function closeSearchRight() {
  searchRightBar.style.display = 'none';
  searchRightInput.classList.remove('no-match');
  searchRightCount.textContent = '';
  // Clear Quill highlights
  try { quill.formatText(0, quill.getLength(), 'background', false); } catch (_) {}
  // Clear preview marks
  clearPreviewMarks();
  rightQuillMatches = [];
  rightIdx = -1;
}
function clearPreviewMarks() {
  try {
    const doc = preview.contentDocument;
    if (!doc) return;
    doc.querySelectorAll('mark.sh').forEach(m => {
      m.parentNode?.replaceChild(doc.createTextNode(m.textContent || ''), m);
    });
    doc.body?.normalize();
  } catch (_) {}
}
function doSearchRight() {
  const q = searchRightInput.value;
  rightQuillMatches = [];
  rightIdx = -1;
  searchRightInput.classList.remove('no-match');

  if (richMode) {
    try { quill.formatText(0, quill.getLength(), 'background', false); } catch (_) {}
    if (!q) { searchRightCount.textContent = ''; return; }
    rightQuillLen = q.length;
    const text  = quill.getText().toLowerCase();
    const ql    = q.toLowerCase();
    let pos = 0;
    while ((pos = text.indexOf(ql, pos)) !== -1) {
      rightQuillMatches.push(pos);
      quill.formatText(pos, q.length, 'background', '#ffeb3b');
      pos += q.length;
    }
    if (!rightQuillMatches.length) {
      searchRightCount.textContent = '無結果';
      searchRightInput.classList.add('no-match');
    } else {
      navigateRight(0);
    }
  } else {
    // Preview mode: mark DOM text nodes
    clearPreviewMarks();
    if (!q) { searchRightCount.textContent = ''; return; }
    try {
      const doc = preview.contentDocument;
      if (!doc?.body) return;
      const ql = q.toLowerCase();
      const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      let n: Text | null;
      while ((n = walker.nextNode() as Text | null)) {
        if (n.textContent?.toLowerCase().includes(ql)) nodes.push(n);
      }
      let count = 0;
      for (const node of nodes) {
        const text  = node.textContent || '';
        const lower = text.toLowerCase();
        const frag  = doc.createDocumentFragment();
        let last = 0, p = 0;
        while ((p = lower.indexOf(ql, last)) !== -1) {
          if (p > last) frag.appendChild(doc.createTextNode(text.slice(last, p)));
          const mk = doc.createElement('mark');
          mk.className = 'sh';
          mk.dataset.idx = String(count++);
          mk.style.cssText = 'background:#ffeb3b;color:#000;border-radius:2px;';
          mk.textContent = text.slice(p, p + q.length);
          frag.appendChild(mk);
          last = p + q.length;
        }
        if (last < text.length) frag.appendChild(doc.createTextNode(text.slice(last)));
        node.parentNode?.replaceChild(frag, node);
      }
      if (count === 0) {
        searchRightCount.textContent = '無結果';
        searchRightInput.classList.add('no-match');
      } else {
        rightQuillMatches = Array.from({length: count}, (_, i) => i);
        navigateRight(0);
      }
    } catch (_) {}
  }
}
function navigateRight(idx: number) {
  if (!rightQuillMatches.length) return;
  rightIdx = ((idx % rightQuillMatches.length) + rightQuillMatches.length) % rightQuillMatches.length;

  if (richMode) {
    // Reset all to yellow, current to orange
    rightQuillMatches.forEach(p => quill.formatText(p, rightQuillLen, 'background', '#ffeb3b'));
    quill.formatText(rightQuillMatches[rightIdx], rightQuillLen, 'background', '#ff9800');
    quill.setSelection(rightQuillMatches[rightIdx], rightQuillLen);
  } else {
    try {
      const marks = preview.contentDocument?.querySelectorAll('mark.sh');
      if (!marks) return;
      marks.forEach((m, i) => {
        (m as HTMLElement).style.background = i === rightIdx ? '#ff9800' : '#ffeb3b';
      });
      (marks[rightIdx] as HTMLElement)?.scrollIntoView({ block: 'center' });
    } catch (_) {}
  }
  searchRightCount.textContent = `${rightIdx + 1} / ${rightQuillMatches.length}`;
}
searchRightBtn.addEventListener('click', openSearchRight);
searchRightInput.addEventListener('input', doSearchRight);
searchRightNext.addEventListener('click', () => navigateRight(rightIdx + 1));
searchRightPrev.addEventListener('click', () => navigateRight(rightIdx - 1));
searchRightClose.addEventListener('click', closeSearchRight);
searchRightInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); navigateRight(e.shiftKey ? rightIdx - 1 : rightIdx + 1); }
  if (e.key === 'Escape') closeSearchRight();
});

// ── Ctrl+F: open search in the relevant panel ─────────────────────────────────
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); return; }
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    const active = document.activeElement;
    const inLeft = active === sourceArea || searchLeftBar.contains(active as Node);
    if (inLeft) openSearchLeft(); else openSearchRight();
  }
});

// ── Messages from extension ───────────────────────────────────────────────────
window.addEventListener('message', (event) => {
  const msg = event.data;
  switch (msg.type) {
    case 'init':         loadHtml(msg.payload.html); break;
    case 'saved':        isDirty = false; setStatus('✓ 已保存 ' + new Date().toLocaleTimeString(), true); break;
    case 'saveFailed':   setStatus('❌ 保存失败: ' + msg.error, false); break;
    case 'fileAttached': insertAttachment(msg.payload); break;
    case 'attachError':  setStatus('❌ ' + msg.error); break;
    case 'inputBoxResult': {
      const { purpose, value } = msg.payload || {};
      if (value == null) break;  // user cancelled
      if (purpose === 'imageWidth') applyImageWidth(value);
      break;
    }
    case 'imageResolved': {
      const { relPath, webviewUri } = msg.payload;
      // Insert image into Quill at current cursor with webview URI (for display)
      if (richMode) {
        const range = quill.getSelection(true) || { index: quill.getLength() };
        quill.insertEmbed(range.index, 'image', webviewUri, 'user');
        quill.setSelection(range.index + 1, 0, 'silent');
      }
      // Also insert relative path into sourceArea (for saving)
      const pos    = sourceArea.selectionStart ?? sourceArea.value.length;
      const before = sourceArea.value.slice(0, pos);
      const after  = sourceArea.value.slice(pos);
      sourceArea.value = before + `\n<img src="${relPath}" alt="${relPath}">` + after;
      schedulePreview();
      isDirty = true;
      setStatus(`📎 已附加圖片`);
      break;
    }
    case 'imageResolveFailed':
      setStatus(`❌ 圖片路徑解析失敗: ${msg.payload?.relPath}`);
      break;
    case 'imagePathsConverted':
      // Set preview with webview URI'd image paths
      preview.srcdoc = msg.payload?.html || '';
      break;
    case 'convertImagePathsFailed':
      console.error('Failed to convert image paths:', msg.payload?.error);
      // Fallback to original HTML without converted paths
      const raw = sourceArea.value;
      const full = /^\s*<!DOCTYPE/i.test(raw) || /^\s*<html/i.test(raw);
      preview.srcdoc = full ? raw : wrapHtml(raw);
      break;
  }
});

// ── Initialize panel layout on startup ────────────────────────────────────────
setPanelWidth(30);  // Set default: 30% source code, 70% editor/preview

vscode.postMessage({ type: 'ready' });

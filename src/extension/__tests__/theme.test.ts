import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  DEFAULT_THEME_CSS,
  THEME_FILE_RELPATH,
  buildHtmlDocument,
  resolveThemeCss,
  sanitizeCss,
} from '../utils/theme';

describe('buildHtmlDocument（包裝與樣式注入）', () => {
  test('fragment 包裝為完整文件並注入 <style> 主題', () => {
    // Arrange
    const fragment = '<h1>標題</h1><div class="ve-block">內容</div>';

    // Act
    const doc = buildHtmlDocument(fragment, 'CLAUDE', DEFAULT_THEME_CSS);

    // Assert
    expect(doc).toContain('<!DOCTYPE html>');
    expect(doc).toContain('<title>CLAUDE</title>');
    expect(doc).toContain('<style>');
    expect(doc).toContain('.ve-block');           // 主題含 ve-block 中性規則
    expect(doc).toContain('Noto Sans TC');        // 規格藍主題特徵
    expect(doc).toContain(fragment);
  });

  test('內容已是完整文件（<!doctype）時 passthrough，不重複包裝、不注入', () => {
    // Arrange
    const full = '<!DOCTYPE html>\n<html><head><title>x</title></head><body>y</body></html>';

    // Act
    const doc = buildHtmlDocument(full, 'ignored', DEFAULT_THEME_CSS);

    // Assert
    expect(doc).toBe(full);
  });

  test('內容以 <html 開頭時亦 passthrough', () => {
    const full = '<html><body>bare</body></html>';
    expect(buildHtmlDocument(full, 'ignored', DEFAULT_THEME_CSS)).toBe(full);
  });

  test('fragment 內的 Quill 表格於包裝前補上 thead > th（spec: table-header）', () => {
    // Arrange：Quill table 模組產出的形狀，只有 tbody / tr / td
    const fragment =
      '<table><tbody><tr><td>模組</td><td>說明</td></tr>' +
      '<tr><td>稽核記錄</td><td>逐項檢核</td></tr></tbody></table>';

    // Act
    const doc = buildHtmlDocument(fragment, 'spec', DEFAULT_THEME_CSS);

    // Assert：主題的 th 樣式才選得到元素
    expect(doc).toContain('<thead>');
    expect(doc).toContain('<th scope="col">模組</th>');
    expect(doc).toContain('<td>稽核記錄</td>');
  });

  test('完整 HTML 文件內的表格同樣補上 thead（Webview 實際送出的形狀）', () => {
    // Arrange：sourceArea.value 幾乎都是完整文件，只處理 fragment 分支等同不生效
    const full =
      '<!DOCTYPE html><html lang="zh-TW"><head><meta charset="UTF-8"><title>t</title>' +
      `<style>${DEFAULT_THEME_CSS}</style></head><body><table><tbody>` +
      '<tr><td>模組</td></tr><tr><td>稽核記錄</td></tr></tbody></table></body></html>';

    // Act
    const out = buildHtmlDocument(full, 'ignored', DEFAULT_THEME_CSS);

    // Assert：表格補上標頭，但不重複包裝、不重複注入樣式
    expect(out).toContain('<thead>');
    expect(out).toContain('<th scope="col">模組</th>');
    expect(out).toContain('<td>稽核記錄</td>');
    expect(out.match(/<!DOCTYPE html>/gi)).toHaveLength(1);
    expect(out.match(/<style>/g)).toHaveLength(1);
    expect(out).toContain('<title>t</title>');   // 原標題保留，不被 title 參數覆寫
  });

  test('完整 HTML 文件無表格時仍原樣回傳', () => {
    const full = '<!DOCTYPE html><html><body><p>沒有表格</p></body></html>';

    expect(buildHtmlDocument(full, 'ignored', DEFAULT_THEME_CSS)).toBe(full);
  });
});

describe('resolveThemeCss（樣式來源查找）', () => {
  let tmpRoot: string;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hve-theme-'));
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  test('文件目錄向上找到 .kiro/assets/doc-style.css 時回傳其內容', () => {
    // Arrange：workspace 根放外部主題，文件位於子目錄
    const cssPath = path.join(tmpRoot, THEME_FILE_RELPATH);
    fs.mkdirSync(path.dirname(cssPath), { recursive: true });
    fs.writeFileSync(cssPath, 'body { color: red; }', 'utf-8');
    const docDir = path.join(tmpRoot, 'docs', 'sub');
    fs.mkdirSync(docDir, { recursive: true });
    const docPath = path.join(docDir, 'CLAUDE.md');

    // Act
    const css = resolveThemeCss(docPath, tmpRoot);

    // Assert
    expect(css).toBe('body { color: red; }');
  });

  test('找不到外部主題檔時 fallback 內建預設主題', () => {
    const docPath = path.join(tmpRoot, 'CLAUDE.md');
    expect(resolveThemeCss(docPath, tmpRoot)).toBe(DEFAULT_THEME_CSS);
  });

  test('查找不越過 stopAtFsPath 邊界', () => {
    // Arrange：主題檔放在邊界「之外」（tmpRoot），邊界設在子目錄 ws
    const cssPath = path.join(tmpRoot, THEME_FILE_RELPATH);
    fs.mkdirSync(path.dirname(cssPath), { recursive: true });
    fs.writeFileSync(cssPath, 'body { color: blue; }', 'utf-8');
    const ws = path.join(tmpRoot, 'ws');
    const docDir = path.join(ws, 'docs');
    fs.mkdirSync(docDir, { recursive: true });
    const docPath = path.join(docDir, 'a.md');

    // Act：邊界為 ws → 不應找到 tmpRoot 下的主題檔
    const css = resolveThemeCss(docPath, ws);

    // Assert
    expect(css).toBe(DEFAULT_THEME_CSS);
  });

  test('外部 CSS 含 </style> 時做轉義防斷', () => {
    const cssPath = path.join(tmpRoot, THEME_FILE_RELPATH);
    fs.mkdirSync(path.dirname(cssPath), { recursive: true });
    fs.writeFileSync(cssPath, 'body{}/*</style><script>alert(1)</script>*/', 'utf-8');
    const docPath = path.join(tmpRoot, 'a.md');

    const css = resolveThemeCss(docPath, tmpRoot);

    expect(css).not.toContain('</style>');
    expect(css).toContain('<\\/style>');
  });
});

describe('sanitizeCss', () => {
  test('大小寫混用的 </StYlE 一併轉義（統一替換為小寫轉義形式）', () => {
    expect(sanitizeCss('a</StYlE>b')).toBe('a<\\/style>b');
  });
});

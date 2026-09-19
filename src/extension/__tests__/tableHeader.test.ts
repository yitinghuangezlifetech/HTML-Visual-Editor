import { demoteTableHeaders, promoteTableHeaders } from '../utils/tableHeader';

/** Quill table 模組實際產出的形狀：只有 tbody / tr / td，儲存格帶 data-row */
const quillTable = (rows: string[]) => `<table><tbody>${rows.join('')}</tbody></table>`;

describe('promoteTableHeaders（第一列升級為 thead > th）', () => {
  test('Quill 式表格：第一列轉為 thead > th，其餘列維持 td', () => {
    // Arrange
    const html = quillTable([
      '<tr data-row="r1"><td data-row="r1">模組</td><td data-row="r1">說明</td></tr>',
      '<tr data-row="r2"><td data-row="r2">稽核路線管理</td><td data-row="r2">建立稽核路線</td></tr>',
      '<tr data-row="r3"><td data-row="r3">稽核記錄</td><td data-row="r3">逐項檢核</td></tr>',
    ]);

    // Act
    const out = promoteTableHeaders(html);

    // Assert
    expect(out).toContain('<thead>');
    expect(out).toContain('<th data-row="r1" scope="col">模組</th>');
    expect(out).toContain('<th data-row="r1" scope="col">說明</th>');
    expect(out).toContain('<td data-row="r2">稽核路線管理</td>');
    // 標頭列已搬離 tbody，thead 位於 table 第一個子節點
    expect(out.indexOf('<thead>')).toBeLessThan(out.indexOf('<tbody>'));
    expect(out).not.toContain('<td data-row="r1">');
  });

  test('儲存格屬性與內層 HTML 完整保留', () => {
    const html = quillTable([
      '<tr><td colspan="2" style="text-align:center" class="hdr"><strong>模<em>組</em></strong></td></tr>',
      '<tr><td>a</td><td>b</td></tr>',
    ]);

    const out = promoteTableHeaders(html);

    expect(out).toContain('colspan="2"');
    expect(out).toContain('style="text-align:center"');
    expect(out).toContain('class="hdr"');
    expect(out).toContain('<strong>模<em>組</em></strong>');
    expect(out).toMatch(/<th [^>]*scope="col">/);
  });

  test('已含 thead 時不做二次處理（原字串回傳）', () => {
    const html =
      '<table><thead><tr><th>模組</th></tr></thead><tbody><tr><td>稽核記錄</td></tr></tbody></table>';

    expect(promoteTableHeaders(html)).toBe(html);
  });

  test('已含 th（無 thead）時不做二次處理', () => {
    const html = quillTable(['<tr><th>模組</th></tr>', '<tr><td>稽核記錄</td></tr>']);

    expect(promoteTableHeaders(html)).toBe(html);
  });

  test('冪等：重複套用結果一致', () => {
    const html = quillTable(['<tr><td>h1</td><td>h2</td></tr>', '<tr><td>a</td><td>b</td></tr>']);

    const once = promoteTableHeaders(html);
    const twice = promoteTableHeaders(once);

    expect(twice).toBe(once);
  });

  test('單列表格預設不升級；minRows: 1 時升級', () => {
    const html = quillTable(['<tr><td>只有一列</td></tr>']);

    expect(promoteTableHeaders(html)).toBe(html);

    const forced = promoteTableHeaders(html, { minRows: 1 });
    expect(forced).toContain('<thead>');
    expect(forced).toContain('<th scope="col">只有一列</th>');
    // 標頭列搬離後留下的空 tbody 一併移除
    expect(forced).not.toContain('<tbody></tbody>');
  });

  test('不含表格的 HTML 原字串回傳（未經 parse5 重新序列化）', () => {
    const html = '<h1>標題</h1><p>內容 &amp; 實體</p><img src="a.png">';

    expect(promoteTableHeaders(html)).toBe(html);
  });

  test('巢狀表格：內外層各自升級，外層標頭不取到內層的列', () => {
    const html =
      '<table><tbody>' +
      '<tr><td>外層標頭</td></tr>' +
      '<tr><td><table><tbody><tr><td>內層標頭</td></tr><tr><td>內層資料</td></tr></tbody></table></td></tr>' +
      '</tbody></table>';

    const out = promoteTableHeaders(html);

    expect(out).toContain('<th scope="col">外層標頭</th>');
    expect(out).toContain('<th scope="col">內層標頭</th>');
    expect(out).toContain('<td>內層資料</td>');
    expect((out.match(/<thead>/g) ?? []).length).toBe(2);
  });

  test('完整 HTML 文件：升級表格且保留 doctype / head / style', () => {
    // Arrange：Webview sourceArea.value 的實際形狀
    const full =
      '<!DOCTYPE html>\n<html lang="zh-TW">\n<head>\n<meta charset="UTF-8">\n' +
      '<title>規格書</title>\n<style>th{background:#eff6ff}</style>\n</head>\n<body>\n' +
      '<h2>功能模組</h2>' +
      '<table><tbody><tr><td>模組</td><td>說明</td></tr>' +
      '<tr><td>稽核記錄</td><td>逐項檢核</td></tr></tbody></table>\n</body>\n</html>';

    // Act
    const out = promoteTableHeaders(full);

    // Assert
    expect(out).toContain('<thead>');
    expect(out).toContain('<th scope="col">模組</th>');
    expect(out).toMatch(/^<!DOCTYPE html>/i);
    expect(out).toContain('<html lang="zh-TW">');
    expect(out).toContain('<meta charset="UTF-8">');
    expect(out).toContain('<title>規格書</title>');
    expect(out).toContain('<style>th{background:#eff6ff}</style>');
    expect(out).toContain('<h2>功能模組</h2>');
  });

  test('完整 HTML 文件無可升級表格時原字串回傳（不經序列化正規化）', () => {
    const full =
      '<!DOCTYPE html>\n<html>\n<head><title>t</title></head>\n<body>' +
      '<table><thead><tr><th>已語意化</th></tr></thead><tbody><tr><td>a</td></tr></tbody></table>' +
      '</body>\n</html>';

    expect(promoteTableHeaders(full)).toBe(full);
  });

  test('以 <html 開頭（無 doctype）的完整文件亦正確處理', () => {
    const out = promoteTableHeaders(
      '<html><body><table><tbody><tr><td>h</td></tr><tr><td>d</td></tr></tbody></table></body></html>'
    );

    expect(out).toContain('<th scope="col">h</th>');
    expect(out).toContain('<html>');
    expect(out).toContain('<td>d</td>');
  });

  test('table 直接掛 tr（無 tbody）亦正確處理', () => {
    const html = '<table><tr><td>h</td></tr><tr><td>d</td></tr></table>';

    const out = promoteTableHeaders(html);

    expect(out).toContain('<thead><tr><th scope="col">h</th></tr></thead>');
    expect(out).toContain('<td>d</td>');
  });
});

describe('demoteTableHeaders（載入編輯器前降級，Quill 只認得 td）', () => {
  test('thead > th 併回 tbody 最前面並改為 td', () => {
    // Arrange
    const html =
      '<table><thead><tr><th scope="col">模組</th><th scope="col">說明</th></tr></thead>' +
      '<tbody><tr><td>稽核記錄</td><td>逐項檢核</td></tr></tbody></table>';

    // Act
    const out = demoteTableHeaders(html);

    // Assert
    expect(out).not.toContain('<thead>');
    expect(out).not.toContain('<th');
    expect(out).not.toContain('scope=');
    expect(out).toContain('<tbody><tr><td>模組</td><td>說明</td></tr>');
    expect(out).toContain('<tr><td>稽核記錄</td><td>逐項檢核</td></tr>');
  });

  test('儲存格其他屬性與內層 HTML 保留（只移除 scope）', () => {
    const out = demoteTableHeaders(
      '<table><thead><tr><th colspan="2" class="k" scope="col"><strong>模組</strong></th></tr></thead>' +
        '<tbody><tr><td>a</td></tr></tbody></table>'
    );

    expect(out).toContain('colspan="2"');
    expect(out).toContain('class="k"');
    expect(out).toContain('<strong>模組</strong>');
    expect(out).not.toContain('scope=');
  });

  test('沒有 thead / th 時原字串回傳', () => {
    const html = '<table><tbody><tr><td>a</td></tr><tr><td>b</td></tr></tbody></table>';

    expect(demoteTableHeaders(html)).toBe(html);
  });

  test('無 thead 但有散落 th 時亦降級', () => {
    const out = demoteTableHeaders('<table><tbody><tr><th>h</th></tr><tr><td>d</td></tr></tbody></table>');

    expect(out).not.toContain('<th');
    expect(out).toContain('<td>h</td>');
  });

  test('只有 thead 沒有 tbody 時自動建立 tbody', () => {
    const out = demoteTableHeaders('<table><thead><tr><th>h</th></tr></thead></table>');

    expect(out).toContain('<tbody><tr><td>h</td></tr></tbody>');
    expect(out).not.toContain('<thead>');
  });

  test('完整 HTML 文件：降級表格且保留 doctype / head / style', () => {
    const full =
      '<!DOCTYPE html>\n<html lang="zh-TW">\n<head><title>t</title>' +
      '<style>th{background:red}</style></head>\n<body>' +
      '<table><thead><tr><th scope="col">模組</th></tr></thead>' +
      '<tbody><tr><td>稽核記錄</td></tr></tbody></table></body>\n</html>';

    const out = demoteTableHeaders(full);

    expect(out).toMatch(/^<!DOCTYPE html>/i);
    expect(out).toContain('<title>t</title>');
    expect(out).toContain('<style>th{background:red}</style>');
    expect(out).not.toContain('<thead>');
    expect(out).toContain('<td>模組</td>');
  });
});

describe('promote / demote 往返（編輯器 ↔ 匯出檔）', () => {
  test('匯出檔 → 載入編輯器 → 存回，表格結構穩定', () => {
    // Arrange：匯出檔的形狀
    const exported =
      '<table><thead><tr><th scope="col">模組</th><th scope="col">說明</th></tr></thead>' +
      '<tbody><tr><td>稽核記錄</td><td>逐項檢核</td></tr></tbody></table>';

    // Act：載入編輯器（降級）→ 存檔／轉存（升級）
    const inEditor = demoteTableHeaders(exported);
    const savedAgain = promoteTableHeaders(inEditor);

    // Assert：回到原狀，且編輯器看到的版本沒有任何 th
    expect(inEditor).not.toContain('<th');
    expect(savedAgain).toBe(exported);
  });

  test('多輪往返不累積差異', () => {
    const start = '<table><tbody><tr><td>h1</td><td>h2</td></tr><tr><td>a</td><td>b</td></tr></tbody></table>';

    const r1 = promoteTableHeaders(start);
    const r2 = promoteTableHeaders(demoteTableHeaders(r1));
    const r3 = promoteTableHeaders(demoteTableHeaders(r2));

    expect(r2).toBe(r1);
    expect(r3).toBe(r1);
  });
});

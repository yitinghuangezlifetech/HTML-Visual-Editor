import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..', '..', '..');

describe('doc-style.template.css（打包範本檔）', () => {
  const templatePath = path.join(ROOT, 'media', 'doc-style.template.css');

  test('範本檔存在於 media/（vsix 內含路徑）', () => {
    expect(fs.existsSync(templatePath)).toBe(true);
  });

  test('含 logo 變數與置換說明、規格藍主題關鍵標記', () => {
    const css = fs.readFileSync(templatePath, 'utf-8');
    expect(css).toContain('--doc-logo');            // logo 置換點（CSS 變數）
    expect(css).toContain('--doc-logo-height');
    expect(css).toContain('logo 置換方式');          // 說明文字
    expect(css).toContain('data:image/webp;base64'); // 內嵌 EZLife logo
    expect(css).toContain('.ve-block');              // 匯出區塊中性規則
    expect(css).toContain('樣式單一來源');            // 機制說明
    expect(css).toContain('@media print');           // 列印樣式
    expect(css).toContain('prefers-color-scheme');   // 深色模式
  });

  test('logo data URI 已最佳化（整檔 < 40KB）', () => {
    expect(fs.statSync(templatePath).size).toBeLessThan(40 * 1024);
  });
});

describe('package.json（指令貢獻）', () => {
  test('已註冊建立主題範本指令', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
    const commands = pkg.contributes?.commands ?? [];
    const ids = commands.map((c: { command: string }) => c.command);
    expect(ids).toContain('htmlVisualEditor.createThemeTemplate');
  });
});

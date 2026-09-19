import { htmlToMarkdown } from '../utils/htmlToMarkdown';
import { DEFAULT_THEME_CSS, buildHtmlDocument } from '../utils/theme';

describe('htmlToMarkdown', () => {
  describe('基础转换', () => {
    test('将 <h1> 转换为 Markdown 标题', () => {
      const html = '<h1>标题</h1>';
      const md = htmlToMarkdown(html);
      expect(md).toContain('# 标题');
    });

    test('将 <p> 转换为段落', () => {
      const html = '<p>这是一个段落</p>';
      const md = htmlToMarkdown(html);
      expect(md).toContain('这是一个段落');
    });

    test('将 <strong> 转换为粗体', () => {
      const html = '<strong>粗体文本</strong>';
      const md = htmlToMarkdown(html);
      expect(md).toContain('**粗体文本**');
    });

    test('将 <em> 转换为斜体', () => {
      const html = '<em>斜体文本</em>';
      const md = htmlToMarkdown(html);
      expect(md).toContain('*斜体文本*');
    });
  });

  describe('链接和图片', () => {
    test('将 <a> 转换为 Markdown 链接', () => {
      const html = '<a href="https://example.com">链接</a>';
      const md = htmlToMarkdown(html);
      expect(md).toContain('[链接](https://example.com)');
    });

    test('将相对路径链接保留', () => {
      const html = '<a href="test/file.pdf">文件</a>';
      const md = htmlToMarkdown(html);
      expect(md).toContain('[文件](test/file.pdf)');
    });

    test('将 <img> 转换为 Markdown 图片', () => {
      const html = '<img src="test/photo.png" alt="照片">';
      const md = htmlToMarkdown(html);
      expect(md).toContain('![照片](test/photo.png)');
    });
  });

  describe('列表', () => {
    test('将 <ul> 转换为无序列表', () => {
      const html = '<ul><li>项目 1</li><li>项目 2</li></ul>';
      const md = htmlToMarkdown(html);
      expect(md).toContain('- 项目 1');
      expect(md).toContain('- 项目 2');
    });

    test('将 <ol> 转换为有序列表', () => {
      const html = '<ol><li>第一项</li><li>第二项</li></ol>';
      const md = htmlToMarkdown(html);
      expect(md).toContain('1. 第一项');
      expect(md).toContain('2. 第二项');
    });
  });

  describe('代码块', () => {
    test('将 <code> 转换为内联代码', () => {
      const html = '<p>使用 <code>const x = 1;</code> 语法</p>';
      const md = htmlToMarkdown(html);
      expect(md).toContain('`const x = 1;`');
    });

    test('将 <pre><code> 转换为代码块', () => {
      const html = '<pre><code>function test() {\n  return true;\n}</code></pre>';
      const md = htmlToMarkdown(html);
      expect(md).toContain('```');
    });
  });

  describe('边界情况', () => {
    test('处理空 HTML', () => {
      const html = '';
      const md = htmlToMarkdown(html);
      expect(md).toBeDefined();
    });

    test('处理嵌套标签', () => {
      const html = '<p>这是 <strong><em>嵌套</em></strong> 文本</p>';
      const md = htmlToMarkdown(html);
      expect(md).toContain('嵌套');
    });

    test('保留 HTML 实体', () => {
      const html = '<p>&lt;tag&gt; &amp; 符号</p>';
      const md = htmlToMarkdown(html);
      expect(md).toContain('<tag>');
      expect(md).toContain('&');
    });
  });

  // spec: .kiro/spec/table-header/
  describe('表格（GFM）', () => {
    test('thead / th 表格轉為標準 GFM 表格（含分隔列）', () => {
      // Arrange
      const html =
        '<table><thead><tr><th>模組</th><th>說明</th></tr></thead>' +
        '<tbody><tr><td>稽核記錄</td><td>逐項檢核</td></tr></tbody></table>';

      // Act
      const md = htmlToMarkdown(html);

      // Assert
      expect(md).toContain('| 模組 | 說明 |');
      expect(md).toMatch(/\|\s*-{3,}\s*\|/);
      expect(md).toContain('| 稽核記錄 | 逐項檢核 |');
    });

    test('無 thead 的 Quill 表格仍輸出合法 GFM 表格（不被拆成散落文字）', () => {
      const html =
        '<table><tbody><tr data-row="r1"><td data-row="r1">模組</td><td data-row="r1">說明</td></tr>' +
        '<tr data-row="r2"><td data-row="r2">稽核記錄</td><td data-row="r2">逐項檢核</td></tr></tbody></table>';

      const md = htmlToMarkdown(html);

      expect(md).toContain('| 模組 | 說明 |');
      expect(md).toMatch(/\|\s*-{3,}\s*\|/);
      expect(md).toContain('| 稽核記錄 | 逐項檢核 |');
    });

    test('單列表格亦產生標頭列（minRows: 1）', () => {
      const md = htmlToMarkdown('<table><tbody><tr><td>只有一列</td></tr></tbody></table>');

      expect(md).toContain('| 只有一列 |');
      expect(md).toMatch(/\|\s*-{3,}\s*\|/);
    });
  });

  describe('非內文節點', () => {
    test('完整文件的主題 CSS 與 title 文字不外洩到 Markdown', () => {
      // Arrange：save 實際傳入的形狀（已包主題的完整 HTML 文件）
      const full = buildHtmlDocument('<h1>標題</h1><p>內容</p>', 'CLAUDE', DEFAULT_THEME_CSS);

      // Act
      const md = htmlToMarkdown(full);

      // Assert
      expect(md).not.toContain('Noto Sans TC');
      expect(md).not.toContain('border-collapse');
      expect(md).not.toContain('CLAUDE');
      expect(md).toContain('# 標題');
      expect(md).toContain('內容');
    });

    test('<script> 內容不外洩', () => {
      const md = htmlToMarkdown('<p>hi</p><script>alert("x")</script>');

      expect(md).not.toContain('alert');
      expect(md).toContain('hi');
    });
  });
});

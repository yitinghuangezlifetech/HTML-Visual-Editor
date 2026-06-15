import { htmlToMarkdown } from '../utils/htmlToMarkdown';

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
});

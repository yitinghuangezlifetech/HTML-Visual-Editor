/**
 * 基础测试示例 — 演示如何使用 Jest
 * 这些测试应该全部通过
 */

describe('基础 Jest 设置', () => {
  test('1 + 1 应该等于 2', () => {
    expect(1 + 1).toBe(2);
  });

  test('字符串应该包含子字符串', () => {
    const message = 'Hello, World!';
    expect(message).toContain('World');
  });

  test('数组应该包含元素', () => {
    const items = ['apple', 'banana', 'orange'];
    expect(items).toContain('banana');
  });

  test('对象应该有正确的属性', () => {
    const file = { name: 'test.html', size: 1024 };
    expect(file).toHaveProperty('name', 'test.html');
  });

  test('正则表达式应该匹配模式', () => {
    const html = '<img src="test/photo.png">';
    const imgRegex = /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*)>/gi;
    expect(imgRegex.test(html)).toBe(true);
  });
});

describe('项目特定的单元测试框架', () => {
  test('相对路径不应包含协议', () => {
    const relPath = 'test/photo.png';
    const isRelative = !relPath.includes('://');
    expect(isRelative).toBe(true);
  });

  test('绝对路径应包含协议', () => {
    const absPath = 'https://example.com/photo.png';
    const isAbsolute = absPath.includes('://');
    expect(isAbsolute).toBe(true);
  });

  test('文件扩展名应被正确识别', () => {
    const filename = 'photo.png';
    const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
    const imageExts = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
    expect(imageExts.has(ext)).toBe(true);
  });

  test('HTML 文件应生成对应的 .md 路径', () => {
    const htmlPath = '/path/to/document.html';
    const mdPath = htmlPath.replace(/\.html$/i, '.md');
    expect(mdPath).toBe('/path/to/document.md');
  });

  test('文件名冲突检测应工作', () => {
    const existingFiles = ['photo.png', 'photo_2.png'];
    let suffix = 2;
    let newName = `photo_${suffix + 1}.png`;

    while (existingFiles.includes(newName)) {
      suffix++;
      newName = `photo_${suffix + 1}.png`;
    }

    expect(newName).toBe('photo_3.png');
  });
});

describe('异步测试示例', () => {
  test('Promise 应该 resolve', async () => {
    const promise = Promise.resolve('success');
    const result = await promise;
    expect(result).toBe('success');
  });

  test('setTimeout 应该延迟执行', async () => {
    const promise = new Promise(resolve => {
      setTimeout(() => resolve('done'), 100);
    });
    const result = await promise;
    expect(result).toBe('done');
  });
});

# 自动化测试策略

## 概述

本项目采用**分层测试方案**，从单元测试到端到端测试，确保各个模块的正确性。

---

## 测试层级

### 1. 单元测试（Unit Tests）

**目标**：测试纯函数和独立模块

**覆盖范围**：
- `src/extension/utils/htmlToMarkdown.ts` — HTML → Markdown 转换
- `src/extension/utils/markdownToHtml.ts` — Markdown → HTML 转换
- `src/extension/utils/resourceResolver.ts` — 资源 URI 解析

**工具**：Jest

**运行**：
```bash
npm test
npm test:watch          # 监视模式
npm test:coverage       # 生成覆盖率报告
```

**示例**：
```
✓ htmlToMarkdown
  ✓ 将 <h1> 转换为 Markdown 标题
  ✓ 将 <a> 转换为链接
  ✓ 处理相对路径
```

### 2. 集成测试（Integration Tests）

**目标**：测试 Extension Host 与 Webview 之间的通讯

**覆盖范围**：
- `attachFile` 消息处理（文件验证 → 复制 → 转换）
- `convertImagePaths` 批量路径转换
- `resolveImage` 单个图片 URI 解析
- Markdown 自动同步

**工具**：Jest + 模拟 VS Code API

**示例测试**：
```typescript
test('attachFile 应创建附件目录并复制文件', () => {
  // 1. 发送 attachFile 消息
  // 2. 验证目录创建
  // 3. 验证文件复制
  // 4. 验证回复消息格式
});
```

### 3. 功能测试（Functional Tests）

**目标**：验证完整的用户工作流

**关键场景**：
1. **上传图片**：点击图片按钮 → 选文件 → 显示预览
2. **编辑与保存**：修改 HTML → Ctrl+S → 生成 .md
3. **撤销/重做**：Ctrl+Z / Ctrl+Y 有效
4. **面板调整**：收闔/展开原始码面板
5. **搜索功能**：Ctrl+F 在源码和内容中搜索

**工具**：vscode-test（VS Code 官方测试框架）

**启用方式**（见 `src/extension/__tests__/runTest.ts`）：
```bash
npm run test:integration
```

### 4. 端到端测试（E2E Tests）

**目标**：完全模拟用户操作

**工具**：Playwright / Puppeteer

**未来计划**：
```bash
npm run test:e2e
```

---

## 快速开始

### 运行所有测试

```bash
npm test
```

### 监视模式（文件变化时自动重新运行）

```bash
npm test:watch
```

### 查看覆盖率

```bash
npm test:coverage
open coverage/lcov-report/index.html  # 打开 HTML 报告
```

---

## 测试文件结构

```
src/extension/
├── __tests__/
│   ├── htmlToMarkdown.test.ts       # 单元测试示例
│   ├── extension.integration.test.ts # 集成测试示例
│   └── runTest.ts                    # E2E 测试启动器（待实现）
├── utils/
│   ├── htmlToMarkdown.ts
│   ├── markdownToHtml.ts
│   └── resourceResolver.ts
└── extension.ts
```

---

## 添加新的测试

### 步骤 1：创建测试文件

```typescript
// src/extension/__tests__/myFeature.test.ts
describe('My Feature', () => {
  test('should do something', () => {
    expect(result).toBe(expected);
  });
});
```

### 步骤 2：运行测试

```bash
npm test myFeature  # 仅运行此文件
npm test:watch      # 自动重新运行
```

### 步骤 3：确保覆盖率达标

```bash
npm test:coverage
# 输出应达到 50% 的最低标准（可在 jest.config.js 调整）
```

---

## 测试优先级

| 优先级 | 内容 | 现状 |
|--------|------|------|
| **P0** | 单元测试：转换函数、路径解析 | ✅ 架构就位 |
| **P1** | 集成测试：消息处理、文件操作 | 🔄 待完善 |
| **P2** | 功能测试：完整工作流 | ⏳ 计划中 |
| **P3** | E2E 测试：UI 自动化 | ⏳ 计划中 |

---

## 常见问题

### Q：如何在 CI/CD 中运行测试？

在 GitHub Actions 或 GitLab CI 中添加：
```yaml
- name: Run Tests
  run: npm test -- --coverage --ci
```

### Q：如何跳过某些测试？

```typescript
test.skip('暂时跳过此测试', () => {
  // ...
});
```

### Q：如何调试测试？

```bash
node --inspect-brk ./node_modules/.bin/jest --runInBand
# 或在 VS Code 中添加 launch config
```

### Q：如何测试 Webview 的代码？

Webview 代码需要浏览器环境，推荐：
1. 单独测试纯逻辑（如 `insertAttachment`）
2. 使用 jsdom 或 happy-dom 模拟 DOM
3. 或集成到 E2E 测试中

---

## 下一步

1. ✅ Jest 框架配置
2. ⏳ 补充 htmlToMarkdown / markdownToHtml 的单元测试覆盖率
3. ⏳ 实现 Extension Host 集成测试（模拟 VS Code API）
4. ⏳ 编写功能测试（使用 vscode-test）
5. ⏳ 设置 CI/CD 自动化测试

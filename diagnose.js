#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 HTML Visual Editor 診斷工具\n');

const checks = [
  {
    name: 'extension.js 編譯檔案',
    path: './dist/extension.js',
    check: (p) => fs.existsSync(p) && fs.statSync(p).size > 0
  },
  {
    name: 'package.json 配置',
    path: './package.json',
    check: (p) => {
      if (!fs.existsSync(p)) return false;
      const pkg = JSON.parse(fs.readFileSync(p, 'utf-8'));
      return pkg.main && pkg.contributes && pkg.contributes.customEditors;
    }
  },
  {
    name: 'TypeScript 編譯',
    path: './src/extension/extension.ts',
    check: (p) => fs.existsSync(p)
  },
  {
    name: 'dist 文件夾',
    path: './dist',
    check: (p) => fs.existsSync(p) && fs.statSync(p).isDirectory()
  }
];

console.log('📋 檢查清單：\n');
let allPassed = true;

checks.forEach(({ name, path: checkPath, check }) => {
  const fullPath = path.resolve(checkPath);
  const passed = check(fullPath);
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}`);
  if (!passed) {
    console.log(`   路徑: ${fullPath}`);
    allPassed = false;
  }
});

console.log('\n🚀 後續步驟：\n');
if (allPassed) {
  console.log('1. 重新啟動 VS Code / Kiro');
  console.log('2. 打開任何 .html 檔案');
  console.log('3. 右鍵 → "Open with" → "HTML Visual Editor"');
  console.log('4. 按 Ctrl+Shift+U 查看 Output 面板 (Extension Host)');
} else {
  console.log('❌ 檔案缺失或配置錯誤');
  console.log('   執行: npm run build');
}

console.log('\n📄 版本信息：\n');
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
console.log(`版本: ${pkg.version}`);
console.log(`VS Code 最低版本: ${pkg.engines.vscode}`);
console.log(`主入口: ${pkg.main}`);
console.log(`自訂編輯器 ID: ${pkg.contributes.customEditors[0].viewType}`);

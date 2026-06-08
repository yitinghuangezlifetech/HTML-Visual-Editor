#!/bin/bash

echo "🔍 HTML Visual Editor 擴展檢查"
echo "================================"
echo ""

# 檢查編譯
echo "1️⃣  檢查編譯..."
if [ -f "dist/extension.js" ]; then
  SIZE=$(wc -c < "dist/extension.js")
  echo "✅ dist/extension.js 存在 ($SIZE 字節)"
else
  echo "❌ dist/extension.js 不存在"
  echo "   運行: npm run build"
  exit 1
fi

echo ""
echo "2️⃣  檢查 package.json 配置..."
if grep -q '"main": "./dist/extension.js"' package.json; then
  echo "✅ main 字段正確指向 dist/extension.js"
else
  echo "❌ main 字段配置有誤"
fi

if grep -q '"htmlVisualEditor.editor"' package.json; then
  echo "✅ customEditor 'htmlVisualEditor.editor' 已註冊"
else
  echo "❌ customEditor 未註冊"
fi

echo ""
echo "3️⃣  檢查源代碼..."
if grep -q "export function activate" src/extension/extension.ts; then
  echo "✅ activate 函數已導出"
else
  echo "❌ activate 函數未正確導出"
fi

if grep -q "console.log.*EXTENSION ACTIVATING" src/extension/extension.ts; then
  echo "✅ 啟動日誌已添加"
else
  echo "❌ 啟動日誌未找到"
fi

echo ""
echo "4️⃣  檢查編譯後的代碼..."
if grep -q "EXTENSION ACTIVATING" dist/extension.js; then
  echo "✅ 日誌代碼已編譯進入 dist/extension.js"
else
  echo "⚠️  日誌代碼未在編譯文件中找到"
fi

echo ""
echo "5️⃣  檢查依賴..."
if [ -d "node_modules/@types/vscode" ]; then
  echo "✅ @types/vscode 已安裝"
else
  echo "❌ @types/vscode 未安裝"
  echo "   運行: npm install"
  exit 1
fi

echo ""
echo "================================"
echo "✅ 基礎檢查完成！"
echo ""
echo "下一步："
echo "1. 在終端運行: npm run watch"
echo "2. 按 F5 啟動擴展調試"
echo "3. 在新窗口按 Ctrl+Shift+U 打開 Output 面板"
echo "4. 在下拉菜單選擇 'Extension Host'"
echo "5. 應該看到 [HTML-Editor] 的日誌"


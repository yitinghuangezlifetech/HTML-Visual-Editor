@echo off
chcp 65001 > nul
title HTML Visual Editor - 自動啟動調試

echo.
echo ====================================
echo 🎨 HTML Visual Editor 調試自動化啟動
echo ====================================
echo.

:: 第 1 步：檢查項目目錄
echo [1/5] 檢查項目目錄...
if not exist "package.json" (
    echo ❌ 錯誤：未找到 package.json
    echo 請確保在項目根目錄運行此腳本
    pause
    exit /b 1
)
echo ✅ 項目目錄正確

:: 第 2 步：重新編譯
echo.
echo [2/5] 重新編譯項目...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 編譯失敗
    pause
    exit /b 1
)
echo ✅ 編譯成功

:: 第 3 步：檢查編譯結果
echo.
echo [3/5] 驗證編譯文件...
if not exist "dist\extension.js" (
    echo ❌ 錯誤：dist\extension.js 不存在
    pause
    exit /b 1
)
echo ✅ 編譯文件已生成 (dist\extension.js)

:: 第 4 步：啟動 watch
echo.
echo [4/5] 啟動開發模式監視...
echo.
echo 📝 監視已啟動，正在監視文件變化...
echo 💡 提示：保持此窗口打開
echo.
echo ====================================
echo 現在請進行以下操作：
echo ====================================
echo.
echo 1️⃣  打開 VSCode
echo 2️⃣  按 F5 或選擇 Run → Start Debugging
echo 3️⃣  等待新的 VSCode 調試窗口打開 (3-5秒)
echo 4️⃣  在新窗口中打開 test.html
echo 5️⃣  右鍵 → Open With... → HTML Visual Editor
echo 6️⃣  按 Ctrl+Shift+U 查看 Output 面板
echo 7️⃣  選擇下拉菜單 → Extension Host
echo.
echo 💬 應該看到以下日誌：
echo    [HTML-Editor] 🎨 開始初始化 WYSIWYG 編輯器...
echo    [HTML-Editor] ✅ WYSIWYG 編輯器已建立
echo.
echo ====================================

:: 啟動 watch（保持運行）
call npm run watch

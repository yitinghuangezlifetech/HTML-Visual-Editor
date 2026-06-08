# HTML Visual Editor - 自動調試啟動腳本
# 用法：在 PowerShell 中運行：.\START_DEBUG.ps1

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "🎨 HTML Visual Editor 自動啟動調試" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 第 1 步：檢查項目目錄
Write-Host "[1/5] 檢查項目目錄..." -ForegroundColor Yellow
if (-not (Test-Path "package.json")) {
    Write-Host "❌ 錯誤：未找到 package.json" -ForegroundColor Red
    Write-Host "請確保在項目根目錄運行此腳本"
    Read-Host "按 Enter 退出"
    exit 1
}
Write-Host "✅ 項目目錄正確" -ForegroundColor Green

# 第 2 步：檢查依賴
Write-Host ""
Write-Host "[2/5] 檢查依賴..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules 不存在，正在安裝依賴..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 安裝依賴失敗" -ForegroundColor Red
        Read-Host "按 Enter 退出"
        exit 1
    }
}
Write-Host "✅ 依賴已就緒" -ForegroundColor Green

# 第 3 步：重新編譯
Write-Host ""
Write-Host "[3/5] 重新編譯項目..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 編譯失敗" -ForegroundColor Red
    Read-Host "按 Enter 退出"
    exit 1
}
Write-Host "✅ 編譯成功" -ForegroundColor Green

# 第 4 步：驗證編譯結果
Write-Host ""
Write-Host "[4/5] 驗證編譯文件..." -ForegroundColor Yellow
if (-not (Test-Path "dist\extension.js")) {
    Write-Host "❌ 錯誤：dist\extension.js 不存在" -ForegroundColor Red
    Read-Host "按 Enter 退出"
    exit 1
}
$fileSize = (Get-Item "dist\extension.js").Length / 1KB
Write-Host "✅ 編譯文件已生成 (大小: $([Math]::Round($fileSize))KB)" -ForegroundColor Green

# 第 5 步：啟動 watch
Write-Host ""
Write-Host "[5/5] 啟動開發模式監視..." -ForegroundColor Yellow
Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host "✅ 預編譯步驟完成！" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "現在啟動開發監視（npm run watch）..." -ForegroundColor Cyan
Write-Host "📝 保持此窗口打開" -ForegroundColor Yellow
Write-Host ""
Write-Host "===================================="-ForegroundColor Cyan
Write-Host "下一步：" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  打開 VSCode" -ForegroundColor White
Write-Host "2️⃣  按 F5 或選擇 Run → Start Debugging" -ForegroundColor White
Write-Host "3️⃣  等待新的 VSCode 調試窗口打開 (3-5秒)" -ForegroundColor White
Write-Host "4️⃣  在新窗口中打開 test.html" -ForegroundColor White
Write-Host "5️⃣  右鍵 → Open With... → HTML Visual Editor" -ForegroundColor White
Write-Host "6️⃣  按 Ctrl+Shift+U 查看 Output 面板" -ForegroundColor White
Write-Host "7️⃣  選擇下拉菜單 → Extension Host" -ForegroundColor White
Write-Host ""
Write-Host "💬 應該看到以下日誌：" -ForegroundColor Cyan
Write-Host "   [HTML-Editor] 🎨 開始初始化 WYSIWYG 編輯器..." -ForegroundColor Gray
Write-Host "   [HTML-Editor] ✅ WYSIWYG 編輯器已建立" -ForegroundColor Gray
Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 啟動 watch（保持運行）
npm run watch

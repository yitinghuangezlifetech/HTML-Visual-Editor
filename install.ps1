# Auto install script
Write-Host "Setting up HTML Visual Editor..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Build
Write-Host "Step 1: Building..." -ForegroundColor Yellow
Set-Location "D:\html-visual-editor"
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Build complete" -ForegroundColor Green
Write-Host ""

# Step 2: Package
Write-Host "Step 2: Packaging VSIX..." -ForegroundColor Yellow
npm exec vsce -- package --no-dependencies
Write-Host "Package complete" -ForegroundColor Green
Write-Host ""

# Step 3: Uninstall old version
Write-Host "Step 3: Uninstalling old version..." -ForegroundColor Yellow
code --uninstall-extension local.html-visual-editor 2>$null
Write-Host "Uninstall complete" -ForegroundColor Green
Write-Host ""

# Step 4: Clear cache
Write-Host "Step 4: Clearing cache..." -ForegroundColor Yellow
$cachePath = "$env:APPDATA\Code\User\globalStorage\local.html-visual-editor*"
Remove-Item -Path $cachePath -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Cache cleared" -ForegroundColor Green
Write-Host ""

# Step 5: Install
Write-Host "Step 5: Installing new version..." -ForegroundColor Yellow
code --install-extension "D:\html-visual-editor\html-visual-editor-0.1.0.vsix"
if ($LASTEXITCODE -eq 0) {
    Write-Host "Installation successful" -ForegroundColor Green
} else {
    Write-Host "Installation may need manual steps" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Done!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Close VS Code completely"
Write-Host "2. Reopen VS Code"
Write-Host "3. Open a .html file"
Write-Host "4. Right-click and select 'HTML Visual Editor'"
Write-Host ""
Read-Host "Press Enter to close"

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ 對話開始時必須執行

**每次對話開始，立即依序讀取以下檔案，再回應任何問題：**

1. `.kiro/steering/basic.md` — 設計哲學、測試標準、執行控管、Spec-First 流程、Windows 指令規範
2. `.kiro/steering/tech.md` — 技術棧、建置指令、Webview 通訊協定
3. `.kiro/steering/structure.md` — 專案目錄結構、Extension Host / Webview 兩層架構
4. `.kiro/steering/product.md` — 產品功能、使用者角色、使用者流程
5. `.kiro/steering/dash.md` — 進度儀表板

以上為 source of truth，所有規範以 `.kiro/steering/` 為準。

---

## 專案簡介

**HTML Visual Editor** 是一個 VS Code / Kiro 擴充功能，為 `.html` 檔案提供 WYSIWYG 視覺編輯與即時預覽（左右分割）。

- **技術棧**：TypeScript + esbuild + Quill（富文字）+ iframe（預覽）
- **架構**：Extension Host（`src/extension/`，Node.js 端）＋ Webview（`src/webview/`，瀏覽器沙箱端），兩層僅透過 `postMessage` 通訊
- **發行者**：ezlifetech　**版本**：0.1.0

> ⚠️ 本專案 **非 Docker 專案**，所有指令於本地直接執行（`npm`），無需容器。

---

## ⚠️ 新功能開發：Spec-First 強制流程（Strict）

**收到任何新功能需求，禁止直接寫程式碼。必須依序完成以下三步驟，每步驟必須等待使用者確認後才進行下一步。**

| 步驟 | 產出檔案 | 中斷點 |
|------|---------|--------|
| Step 1 | `specs/{feature}/requirements.md` | ⛔ 等待使用者確認 |
| Step 2 | `specs/{feature}/design.md` | ⛔ 等待使用者確認 |
| Step 3 | `specs/{feature}/tasks.md` | 逐項完成，勾選 `[x]` |

### 強制規則

1. ❌ **禁止跳步**：未完成 requirements.md 不得建立 design.md，未完成 design.md 不得建立 tasks.md
2. ❌ **禁止口頭設計**：所有設計必須寫入檔案，禁止只在對話中口頭描述而不建檔
3. ❌ **禁止直接寫程式碼**：未完成三份 spec 文件並核准前，不得建立任何 Provider、Webview 元件、工具函式或指令
4. ✅ **等待確認**：Step 1 與 Step 2 完成後，必須明確詢問使用者「是否確認？」，收到確認後才進行下一步

> 文件格式範本見 `.kiro/steering/basic.md` Section 5。

---

## 快速參考

### 環境設置

```bash
npm install        # 安裝相依套件（本地，無需 Docker）
```

### 建置

```bash
npm run build      # 單次編譯（esbuild）
npm run watch      # 監視模式（自動重新編譯）
```

esbuild 輸出：
- `dist/extension.js`（Extension Host）
- `media/rich-editor-bundle.js`（Webview bundle）

### 調試

1. 終端機執行 `npm run watch`，看到 `Watching...` 即可
2. VS Code 按 **F5** 開啟「Extension Development Host」
3. 在新視窗開啟 `test.html`，選擇「HTML Visual Editor」
4. 改完代碼，在調試視窗按 **F5** 或 `Ctrl+R` 重新載入

### 日誌位置

| 用途 | 位置 |
|------|------|
| Extension Host 日誌（`[HTML-Editor]`） | `Ctrl+Shift+U` → Output 下拉選「Extension Host」 |
| Webview 日誌（前端 JS） | 命令面板 → `Developer: Open Webview Developer Tools` → Console |

> Webview 的 `console.log` **不會**出現在 Output 面板，必須開 Webview DevTools。

### 打包與安裝

```bash
# 打包成 vsix
npm exec vsce -- package --no-dependencies
# 產出 html-visual-editor-0.1.0.vsix

# 安裝（直接複製，推薦）
cp -r d:/html-visual-editor ~/.kiro/extensions/ezlifetech.html-visual-editor-0.1.0
```

安裝後重啟 Kiro，開啟 `.html` 檔右鍵選「HTML Visual Editor」。

---

## Webview 三大鐵則（務必遵守）

1. **CSP 必須含 `${webview.cspSource}`** — `script-src` / `style-src` 缺它則 bundle 載入失敗、畫面空白
2. **`acquireVsCodeApi()` 只能呼叫一次** — 不要在 HTML 另加 inline script 搶用 API
3. **HTML 必須提供 bundle 需要的所有元素 ID** — `sourceArea`、`editor`、`preview` 及各工具列／搜尋按鈕

> 既有可運作版本出問題時，**優先還原**，不要在不了解 bundle 依賴的情況下重寫 Webview HTML。詳見 `.kiro/spec/05-history.md`。

---

## 注意事項

### 檔案用途
- 本檔案用於 **Claude Code**（claude.ai/code）的開發指導
- `CODEX.md` 提供 Codex 相同的規則
- Kiro IDE 使用 `.kiro/steering/` 目錄下的 steering 檔案
- 三者共用 `.kiro/steering/` 作為 **source of truth**

### 規範與約束
- 遵循 `.kiro/steering/basic.md` 的設計哲學、測試標準、執行控管
- 遵循 `.kiro/steering/tech.md` 的技術棧與通訊協定
- 禁止行為詳見 `.kiro/steering/basic.md` Section 3

### 進度同步
- 完成 Spec 文件時，必須更新 `.kiro/steering/dash.md`
- 變更技術棧或建置流程時，必須更新 `.kiro/steering/tech.md`
- 新增/變更功能時，必須同步更新 `.kiro/spec/` 對應文件

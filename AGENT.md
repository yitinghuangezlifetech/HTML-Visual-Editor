# CODEX.md

本檔案提供 Codex（codex.ai/code）在此專案中的作業規範。

## 專案簡介

**HTML Visual Editor** 是一個 VS Code / Kiro 擴充功能，為 `.html` 檔案提供 WYSIWYG 視覺編輯與即時預覽（左右分割）。

- **技術棧**：TypeScript + esbuild + Quill + iframe
- **架構**：Extension Host（`src/extension/`）＋ Webview（`src/webview/`），兩層僅透過 `postMessage` 通訊
- **非 Docker 專案**：所有指令於本地直接執行（`npm`）

## 主設定來源

在採取任何行動之前，請依序閱讀下列檔案，並將它們視為專案的權威規則：

1. `.kiro/steering/basic.md`
2. `.kiro/steering/tech.md`
3. `.kiro/steering/structure.md`
4. `.kiro/steering/product.md`
5. `.kiro/steering/dash.md`

如果本檔案與 `.kiro/steering/` 發生衝突，以 `.kiro/steering/` 為準。

## 開發流程

任何新功能或行為調整，請遵循本專案的 Spec-First 流程：

1. 建立 `.kiro/spec/{feature}/requirements.md`
2. 等待使用者確認
3. 建立 `.kiro/spec/{feature}/design.md`
4. 等待使用者確認
5. 建立 `.kiro/spec/{feature}/tasks.md`
6. 逐項實作任務並標記完成

不得跳過步驟。三份 spec 文件完成並核准前，不得撰寫 Provider、Webview 元件、工具函式、指令或路由。

## 撰寫規則

- 優先採用漸進式、最小化變更，並符合既有架構。
- 實作內容需與 `.kiro/steering/structure.md` 的專案結構一致（Extension Host / Webview 兩層分離）。
- 技術與功能決策需與 `.kiro/steering/tech.md` 和 `.kiro/steering/product.md` 一致。
- 優先使用清楚、可維護的程式碼，而不是技巧性寫法。
- 行為變更時，應新增或更新對應的手動測試清單並驗證。
- 遵守 Webview 三大鐵則（CSP 含 `${webview.cspSource}`、`acquireVsCodeApi()` 只呼叫一次、HTML 提供 bundle 所需元素 ID）。

## 執行規則

- 本專案於 Windows 上開發，shell 為 **bash**（Git Bash 風格）：使用 Unix 路徑語法（`/dev/null`、forward slash）。
- 搜尋請優先使用 `rg`（ripgrep）。
- 建置使用 `npm run build` / `npm run watch`，不手動編輯編譯產物（`dist/`、`media/rich-editor-bundle.js`）。
- 除非使用者明確要求，否則避免破壞性命令。
- 不要變更無關檔案，不要還原使用者的變更。

## 品質標準

- 測試在可行時盡量遵循 AAA 風格。
- 函式與元件保持單一職責、聚焦明確。
- 在引入新抽象之前，先重用既有模式（`src/extension/`、`src/webview/`）。
- 以最小且相關的指令驗證變更（`npm run build` + F5 調試 + 手動測試清單）。

## 備註

- Kiro IDE 以 `.kiro/steering/` 作為 source of truth。
- 本檔案的目的，是讓 Codex 遵循與 Claude Code（見 `CLAUDE.md`）相同的專案規則與開發流程。

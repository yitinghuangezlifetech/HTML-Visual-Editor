# basic.md — 設計哲學與作業規範

> 本檔案為專案的 **source of truth** 之一。所有對話開始前必須先讀取本檔。
> 適用對象：Kiro IDE、Claude Code、Codex 及任何協作者。

---

## 1. 設計哲學

1. **漸進式、最小化變更**：優先採用符合既有架構的小步修改，避免大規模重寫。
2. **重用優先**：引入新抽象前，先確認既有模式（`src/extension/`、`src/webview/`）是否已能滿足需求。
3. **單一職責**：函式與模組保持聚焦明確；Extension Host 與 Webview 兩層職責不可混淆。
4. **可維護優先於技巧**：採用清楚、好讀的程式碼，而非炫技寫法。
5. **先還原、再重寫**：既有可運作版本出問題時，**優先還原**，不要在不了解 bundle 依賴的情況下重寫 Webview HTML（詳見 `.kiro/spec/05-history.md` 教訓）。

---

## 2. 測試標準

1. 行為變更時，應新增或更新對應驗證（手動測試清單見 `.kiro/spec/02-development.md`）。
2. 測試盡量遵循 **AAA**（Arrange–Act–Assert）風格。
3. 以最小且相關的指令驗證變更（`npm run build` + F5 調試 + 手動測試清單）。
4. 每次提交前至少完成以下煙霧測試：
   - [ ] 開啟 `test.html`，左側顯示原始碼、右側顯示 Quill 富文字編輯器
   - [ ] 左側編輯 → 右側同步
   - [ ] 切換 🖊 Rich / 👁 Preview
   - [ ] `Ctrl+S` 存檔成功，同目錄產生 `.md`
   - [ ] 關閉重開，修改仍在

---

## 3. 禁止行為

1. ❌ **禁止跳過 Spec-First 流程**（見 Section 5）：未完成三份 spec 文件並核准前，不得撰寫任何新功能程式碼。
2. ❌ **禁止口頭設計**：所有設計必須寫入檔案，不得僅在對話中口頭描述而不建檔。
3. ❌ **禁止破壞 Webview 三大鐵則**（見 `.kiro/spec/05-history.md`）：
   - CSP 必須包含 `${webview.cspSource}`
   - `acquireVsCodeApi()` 一個 webview 只能呼叫一次（勿在 HTML 另加 inline script）
   - HTML 必須提供 bundle 需要的所有元素 ID（`sourceArea`、`editor`、`preview` 等）
4. ❌ **禁止變更無關檔案**，不得還原使用者的變更。
5. ❌ **禁止破壞性指令**，除非使用者明確要求（如刪除 `dist/`、`media/`、`node_modules/` 重建）。

---

## 4. 執行控管

### 4.1 Windows 指令規範
- 本專案於 **Windows 11** 上開發，shell 為 **bash**（Git Bash 風格）。
- 使用 Unix 路徑語法：`/dev/null`（非 `NUL`）、forward slash。
- 搜尋優先使用 `rg`（ripgrep），列出檔案使用對應的檔案工具。
- 本專案 **非 Docker 專案**：所有指令在本地直接執行（`npm install`、`npm run build`），無需容器。

### 4.2 建置與打包
- 編譯：`npm run build`（esbuild，輸出 `dist/extension.js` 與 `media/rich-editor-bundle.js`）
- 監視：`npm run watch`
- 打包：`npm exec vsce -- package --no-dependencies`
- 詳見 `.kiro/steering/tech.md`。

### 4.3 進度同步
- 完成 Spec 文件時，必須更新 `.kiro/steering/dash.md`。
- 新增/變更功能時，必須同步更新 `.kiro/spec/` 對應文件（overview、features、history）。
- 變更技術棧或建置流程時，必須更新 `.kiro/steering/tech.md`。

---

## 5. 新功能開發：Spec-First 強制流程（Strict）

收到任何新功能需求，**禁止直接寫程式碼**。必須依序完成下列三步驟，每步驟須等待使用者確認後才進行下一步。

| 步驟 | 產出檔案 | 中斷點 |
|------|---------|--------|
| Step 1 | `.kiro/spec/{feature}/requirements.md` | ⛔ 等待使用者確認 |
| Step 2 | `.kiro/spec/{feature}/design.md` | ⛔ 等待使用者確認 |
| Step 3 | `.kiro/spec/{feature}/tasks.md` | 逐項完成，勾選 `[x]` |

### 強制規則
1. ❌ 未完成 requirements.md 不得建立 design.md；未完成 design.md 不得建立 tasks.md。
2. ❌ 三份 spec 文件完成並核准前，不得撰寫任何 Provider、Webview 元件、工具函式或指令。
3. ✅ Step 1 與 Step 2 完成後，必須明確詢問使用者「是否確認？」，收到確認後才進行下一步。

### 文件格式範本

**`requirements.md`**
```markdown
# 需求：{功能名稱}

## 使用者故事
- 身為 {角色}，我希望 {動作}，以便 {目的}

## 驗收條件
- [ ] 條件 1

## 範圍外（Out of Scope）
- 排除項目
```

**`design.md`**
```markdown
# 技術設計：{功能名稱}

## Extension Host 變更
- 新增/修改的 Provider、指令、訊息類型

## Webview 變更
- 新增/修改的元件、元素 ID、訊息處理

## 通訊協定
- postMessage 訊息格式（type / payload）

## 影響範圍
- 修改到的既有檔案
```

**`tasks.md`**
```markdown
# 實作任務：{功能名稱}

## 任務清單
- [ ] 1. Extension Host：...
- [ ] 2. Webview：...
- [ ] 3. 通訊：...
- [ ] 4. 手動測試：更新測試清單並驗證
```

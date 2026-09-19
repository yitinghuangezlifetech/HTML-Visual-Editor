# 技術設計：主題範本檔供裝與品牌樣式（theme-template）

## Extension Host 變更

1. **新增打包資產 `media/doc-style.template.css`**（vsix 內含；`.vscodeignore` 現況不排除 `media/*.css`，僅排除 `**/*.map` 與 `**/*.ts`）：
   - 內容＝三專案母版新版：既有「規格藍・CSS 變數版」＋ **logo 檔頭** ＋ **擴充說明註解**。
   - logo 以 CSS 變數承載，置換點單一明確：
     ```css
     :root { --doc-logo: url("data:image/webp;base64,…"); --doc-logo-height: 36px; }
     body::before { content:""; display:block; height:var(--doc-logo-height);
       background:var(--doc-logo) no-repeat left center / contain; margin-bottom:1.4rem; }
     ```
     EZLife logo 採 72px 高 WebP data URI（約 15KB，為原圖 1/6）。深色模式：`body::before` 加淺色底墊（圓角、content-box padding）維持中文灰字可讀；列印保留 logo。
   - 說明註解涵蓋：載入規則（向上查找／完整取代／fallback）、三專案同步約定、**logo 置換方式**（改 `--doc-logo` 的 data URI；附 python 與 PowerShell 產生 data URI 的一行指令；說明為何不建議外部路徑 url）。
2. **`extension.ts` 新增指令** `htmlVisualEditor.createThemeTemplate`（activate 內註冊）：
   - 無工作區 → `showErrorMessage` 明確提示。
   - 目標 `{workspace}/.kiro/assets/doc-style.css` 已存在 → modal `showWarningMessage` 確認「覆寫」才寫入。
   - 由 `extensionPath/media/doc-style.template.css` 複製（`mkdirSync recursive`＋`copyFileSync`）；完成 `showInformationMessage` 顯示相對路徑。
   - 多根工作區：採第一個 folder（範圍註記）。
3. **`package.json`**：`contributes.commands` 新增 `{ command: "htmlVisualEditor.createThemeTemplate", title: "HTML Visual Editor: 建立文件主題範本 (doc-style.css)" }`；版本 `0.1.4 → 0.1.5`。

## Webview 變更

- 無。

## 通訊協定

- 無新增訊息型別（指令走 VS Code command palette，不經 webview）。

## 文件

- `README.md` 新增「文件主題樣式（Document Theme）」章節：主題機制、指令用法、**logo 置換路徑與步驟**、與 `srs_sdd_bridge.py` 等腳本共用約定、0.1.5 版本說明。
- `CHANGELOG.md` 新增 0.1.5 條目。

## 測試

- 新增 `src/extension/__tests__/template.test.ts`（純 fs，jest-safe）：
  - `media/doc-style.template.css` 存在且含 `--doc-logo`、`.ve-block`、說明關鍵字
  - `package.json` 含指令貢獻 `htmlVisualEditor.createThemeTemplate`
- `npm run build`＋jest 全數通過後，以 `npm exec vsce -- package --no-dependencies` 封裝 0.1.5 vsix。

## 影響範圍

- 修改：`src/extension/extension.ts`、`package.json`、`README.md`、`CHANGELOG.md`
- 新增：`media/doc-style.template.css`、`src/extension/__tests__/template.test.ts`
- 同步（依三處同步規則）：範本／kikkoman／ezSport 之 `.kiro/assets/doc-style.css` ← 與範本檔同內容
- 不動：`theme.ts` 的 `DEFAULT_THEME_CSS`（內建 fallback 維持無品牌）、webview、既有指令與訊息

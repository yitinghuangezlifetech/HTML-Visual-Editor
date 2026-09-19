# 實作任務：主題範本檔供裝與品牌樣式（theme-template）

## 任務清單

- [x] 1. 資產：建立 `media/doc-style.template.css` — 母版新版（規格藍 CSS 變數版＋`--doc-logo` EZLife WebP data URI 檔頭＋深色底墊＋列印保留），內附說明註解（載入規則、三處同步、logo 置換方式與 data URI 產生指令）
- [x] 2. Extension Host：`extension.ts` 註冊指令 `htmlVisualEditor.createThemeTemplate`（無工作區錯誤提示、既有檔 modal 覆寫確認、複製範本至 `.kiro/assets/doc-style.css`）
- [x] 3. 設定與文件：`package.json` commands 貢獻＋版本 0.1.5；`README.md`「文件主題樣式」章節（含 logo 置換路徑說明）；`CHANGELOG.md` 0.1.5
- [x] 4. 測試：新增 `template.test.ts`（範本檔存在與關鍵標記、package.json 指令貢獻）；`npm run build` 與 jest 通過
- [x] 5. 封裝與同步：`vsce package --no-dependencies` 產出 0.1.5 vsix；母版同內容同步範本／kikkoman／ezSport 三處；更新 `dash.md` 與 `03-features.md`

## 落地註記

- 封裝產出 `html-visual-editor-0.1.5.vsix`（431.71 KB，9 檔）；範本檔 21.58 KB（含 15KB WebP logo data URI）確認納入 vsix。
- jest 5 套件 44 測試、esbuild 建置於雲端環境通過；F5 實機與指令面板操作請於本機安裝 0.1.5 後驗證。
- 母版（含 logo）已依同步規則寫入範本／kikkoman／ezSport 三處。

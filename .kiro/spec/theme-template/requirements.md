# 需求：主題範本檔供裝與品牌樣式（Theme Template）

## 使用者故事

- 身為新專案的建立者，我希望外掛安裝後就內建 `doc-style.css` 主題範本檔，並提供指令一鍵放入目前工作區，以便不必從其他專案手動複製即可啟用統一文件樣式。
- 身為文件的撰寫與閱讀者，我希望產出的 HTML 帶有 EZLife 公司 logo、範本檔內附清楚的使用說明文字，以便文件外觀更專業、新成員能自行理解樣式機制。

## 驗收條件

- [ ] 外掛打包內含主題範本檔 `media/doc-style.template.css`，內容包含：（a）使用說明註解——載入規則（向上查找、完整取代、fallback）、三專案同步約定、logo 替換方式；（b）EZLife logo 檔頭——`body::before` 以最佳化 WebP data URI 顯示（高 72px、約 15KB），深色模式加淺色底墊維持可讀、列印保留
- [ ] 新增 VS Code 指令「HTML Visual Editor: 建立文件主題範本 (doc-style.css)」：將範本寫入 `{workspace}/.kiro/assets/doc-style.css`；目標檔已存在時須先確認才覆寫；無工作區時給出明確錯誤訊息
- [ ] `README.md` 新增「文件主題樣式」章節說明文字：主題機制、指令用法、外部覆寫與 fallback 規則、與 srs_sdd_bridge.py 等腳本共用約定
- [ ] 母版 `doc-style.css` 同步更新（logo 檔頭＋擴充說明註解）至範本／kikkoman／ezSport 三處（依「修改必同步三處」規則）
- [ ] `npm run build` 與 jest 通過；`.vscodeignore` 確認未排除範本檔（vsix 內含）
- [ ] 實測：乾淨工作區執行指令產生範本 → 開啟 `.md` 存檔 → 產出 HTML 帶 logo 與主題；瀏覽器深色模式與列印預覽正常

## 範圍外（Out of Scope）

- 內建 fallback 主題（`theme.ts` 的 `DEFAULT_THEME_CSS`）**不加 logo**——維持通用無品牌，logo 只存在於範本檔／各專案母版
- logo 圖檔管理 UI、多品牌／多主題切換
- 既有 `.html` 孿生檔的批次重生（重存或重跑腳本即套用）
- 對其他編輯器（Kiro steering、Codex）的安裝流程變更

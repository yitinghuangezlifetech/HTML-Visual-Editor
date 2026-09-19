# 需求：匯出 HTML 主題樣式（Export Theme）

## 使用者故事

- 身為文件維護者，我希望存檔／轉存產生的 `.html` 自動內嵌一套美觀的預設主題樣式，以便產出檔（如 `CLAUDE.html`）用瀏覽器開啟即專業可讀，而不是無樣式的白稿。
- 身為多專案維護者，我希望主題可被工作區的外部 CSS 檔覆寫（約定 `.kiro/assets/doc-style.css`），以便與 `srs_sdd_bridge.py`、`md2html_specs.py` 等其他轉換器共用同一份樣式來源，多方輸出外觀一致。

## 驗收條件

- [ ] `save`（`.md` 存檔連動轉存）與 `exportHtml`（手動轉存）產生的 HTML，`<head>` 內嵌 `<style>` 主題；預設主題為內建「規格藍」（含深色模式與列印樣式）
- [ ] 轉換時若該文件所屬工作區存在 `.kiro/assets/doc-style.css`，優先讀取其內容作為內嵌樣式；讀不到時 fallback 內建預設主題
- [ ] 編輯器 UI 專用樣式（如 `.ve-block` 虛線框）不得出現在匯出檔；匯出檔中的 `.ve-block` 區塊以一般段落樣式正常呈現
- [ ] 開啟 `.md` 時編輯器載入所用的 `markdownToHtml()` 改用同一主題來源（載入預覽與匯出外觀一致，取代現行內嵌的紫色樣式）
- [ ] 內容本身已是完整 HTML 文件（`<!doctype` / `<html` 開頭）時，維持現行原樣寫入行為：不重複包裝、不強制注入樣式
- [ ] `npm run build` 通過；完成 `basic.md` §2.4 煙霧測試清單
- [ ] 實測：以本專案 `CLAUDE.md` 重新存檔後，`CLAUDE.html` 具主題樣式，瀏覽器深色模式與列印預覽正常

## 範圍外（Out of Scope）

- GUI 主題挑選器／多主題切換（此版僅單一內建主題＋外部 CSS 覆寫）
- VS Code 設定項（`htmlVisualEditor.*`）自訂樣式路徑——此版採固定約定路徑，設定化留待後續 spec
- Quill 編輯器內部編輯體驗樣式的重新設計（僅做 UI 樣式與匯出樣式的隔離）
- 舊有已產出 `.html` 的批次回填（重新存檔即套用新樣式）

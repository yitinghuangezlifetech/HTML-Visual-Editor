# 需求：搜尋與取代（Search & Replace）

## 使用者故事

- 身為 HTML 編輯者，我希望在搜尋列中輸入取代文字並執行取代，以便快速批次修改原始碼中的文字內容。

## 驗收條件

- [ ] 搜尋區塊顯示「取代」輸入欄（Replace input）
- [ ] 提供「取代本筆」（Replace）按鈕：僅取代目前游標所在的匹配項
- [ ] 提供「取代全部」（Replace All）按鈕：一次取代所有匹配項並回報替換數量
- [ ] 取代操作僅作用於左側 source 原始碼（`sourceArea`）
- [ ] 取代後，source 內容自動同步至 Quill 編輯器與 preview（走既有雙向同步機制）
- [ ] 取代後，Undo/Redo 歷史可回復（走既有 `HistoryManager`）
- [ ] 搜尋列收起時，取代欄也一併隱藏

## 範圍外（Out of Scope）

- 正規表達式（Regex）取代
- Quill 富文字區內的富文字取代（僅操作 source 原始碼）
- 大小寫不敏感選項（此版先不加）

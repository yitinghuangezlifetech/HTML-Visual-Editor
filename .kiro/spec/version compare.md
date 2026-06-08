  version compare

# HTML Visual Editor — 版本差異比對報告

比對日期：2026-06-08 ・ 比對對象：已安裝擴充功能 vs 開發原始碼專案

## 一、目前安裝的是哪一個版本？

目前 VSCode 實際安裝的擴充功能是 ezlifetech.html\-visual-editor-0.1.0。

判斷依據說明

`package.json` 含 `__metadata`

含有 `installedTimestamp`、`targetPlatform`、`size` —— 這是 VSCode 從 VSIX／市集安裝後才會寫入的標記

目錄命名慣例

`ezlifetech.``html``-visual-editor-0.1.0` 完全符合 VSCode 安裝慣例 `{publisher}.{name}-{version}`

`.vsixmanifest`

Id=`html``-visual-editor`，Version=`0.1.0`，Publisher=`ezlifetech`

### 工作區三個專案的角色

#### 已安裝 ezlifetech.html\-visual-editor-0.1.0

含 \_\_metadata、.vsixmanifest

*   VSCode 實際安裝中的版本
*   dist/extension.js ≈ 620 KB

#### 開發中 html\-visual-editor

含 package-lock.json、spec/、.vsix

*   開發原始碼專案（較新）
*   dist/extension.js ≈ 621 KB

#### 早期版 html\-visual-editor-restfile

publisher = local

*   精簡早期版，只有 parse5 依賴
*   dist 僅 10 KB，無富文字編輯器

## 二、程式碼差異總覽

以下比對「已安裝版」與「開發版」的差異。

### 原始碼（src/）

檔案狀態差異內容

`src/extension/extension.ts`

有差異

開發版新增「存檔同步輸出 .md」與讀取檔案內容傳入 webview

`src/webview/rich-editor.ts`

大量差異

285 行 → 481 行（+196 行），新增搜尋與模式切換

`src/webview/components/`

可忽略

僅資料夾名，兩邊實際皆無檔案

其餘所有 .ts 檔

完全相同

—

### 編譯產物（dist/ 與 media/）

檔案結果

`dist/extension.js`

不同（開發版 621,626 B > 已安裝 620,714 B）

`media/rich-editor-bundle.js`

不同（對應新功能）

`media/editor-bundle.js`

完全相同

## 三、開發版「多出」的功能

#### ① 存檔時同步輸出 Markdown

存 `.``html` 時，同時把內容轉成 `.md` 一起寫出（`html``ToMarkdown`）；並新增讀取檔案內容傳入 `getWebviewContent(fileContent)`。

#### ② 左右雙面板搜尋功能

新增左側原始碼搜尋列（searchLeft）與右側內容搜尋列（searchRight），含輸入框、上一個 ↑、下一個 ↓、關閉 ✕、相符計數與預覽高亮。已安裝版完全沒有任何搜尋程式碼。

#### ③ Rich / Preview 模式切換鈕

右側面板新增 `🖊 Rich` / `👁 Preview` 切換按鈕（btnRich / btnPreview），且預設改為進入富文字編輯模式（已安裝版預設顯示 Live Preview）。

### extension.ts 關鍵差異片段

 // 存檔流程 + // Also save as Markdown + const mdPath = document.uri.fsPath.replace(/\\.html$/i, '.md'); + const markdown = htmlToMarkdown(toWrite); + fs.writeFileSync(mdPath, markdown, 'utf-8');  - webviewPanel.webview.html = this.getWebviewContent(webview, bundleUri.toString()); + let fileContent = ''; + try { fileContent = fs.readFileSync(document.uri.fsPath, 'utf-8'); } + catch (error) { fileContent = '<!-- Failed to read file -->'; } + webviewPanel.webview.html = this.getWebviewContent(webview, bundleUri.toString(), fileContent);

### rich-editor.ts 新增的元素參考（節錄）

+ const btnRich = document.getElementById('btnRich')!; + const btnPreview = document.getElementById('btnPreview')!; + // Left search + const searchLeftBar = document.getElementById('searchLeft')!; + const searchLeftInput = document.getElementById('searchLeftInput'); + // Right search + const searchRightBar = document.getElementById('searchRight')!; + const searchRightInput = document.getElementById('searchRightInput'); + function openSearchLeft() { ... } // 搜尋邏輯與高亮

## 四、結論

**開發版** `**html**``**-visual-editor**` **比目前安裝的版本更新**，主要多了三項功能：

1.  ✅ 存檔同步輸出 `.md`
2.  ✅ 左右雙面板搜尋（含預覽高亮）
3.  ✅ Rich／Preview 切換鈕、預設進富文字模式

這些變更也記錄在開發版的 `spec/05-history.md`（2026-06-07 維護：還原 Quill 架構並「新增儲存時同步輸出 .md」）。若要套用到正在使用的擴充功能，需把開發版重新打包成 VSIX 並重新安裝。

**提醒：**兩版 `package.json` 的依賴有一處差異 —— 開發版多了 `monaco-editor`，但依 `spec/05-history.md` 記載 Monaco 已被放棄、最終採用 Quill，故該依賴目前未實際使用。

產生於 2026-06-08 ・ HTML Visual Editor 版本差異比對
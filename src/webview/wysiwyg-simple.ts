// 簡化版 WYSIWYG 編輯器 - 用於 extension.ts
export class WysiwygEditor {
  private iframe: HTMLIFrameElement;
  private codeEditor: HTMLTextAreaElement;
  private iframeDoc: Document | null = null;
  private selectedElement: Element | null = null;
  private history: string[] = [];
  private historyIndex = -1;

  constructor(iframeEl: HTMLIFrameElement, codeEl: HTMLTextAreaElement) {
    this.iframe = iframeEl;
    this.codeEditor = codeEl;
    this.setupIframe();
    this.setupStylesheet();
    this.setupEventListeners();
    console.log('[WYSIWYG] 編輯器已初始化');
  }

  // 初始化 iframe
  private setupIframe() {
    // 延遲以確保 iframe 已載入
    setTimeout(() => {
      this.iframeDoc = this.iframe.contentDocument;
      if (!this.iframeDoc) {
        console.error('[WYSIWYG] 無法訪問 iframe document');
        return;
      }
      console.log('[WYSIWYG] iframe 已準備');
    }, 100);
  }

  // 添加樣式表
  private setupStylesheet() {
    const checkStyle = () => {
      const iframeDoc = this.iframe.contentDocument;
      if (!iframeDoc || !iframeDoc.head) {
        setTimeout(checkStyle, 100);
        return;
      }

      // 檢查樣式是否已存在
      if (iframeDoc.getElementById('wysiwyg-styles')) return;

      const style = iframeDoc.createElement('style');
      style.id = 'wysiwyg-styles';
      style.textContent = `
        [data-selected] {
          outline: 2px solid #0066cc !important;
          outline-offset: -1px !important;
          background-color: rgba(0, 102, 204, 0.05) !important;
        }
        [data-editable] {
          border: 1px dashed #999 !important;
          padding: 2px !important;
        }
        body {
          user-select: text;
        }
        #context-menu {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 12px;
        }
      `;
      iframeDoc.head.appendChild(style);
      console.log('[WYSIWYG] 樣式已添加');
    };
    checkStyle();
  }

  // 設置事件監聽
  private setupEventListeners() {
    const setupEvents = () => {
      const iframeDoc = this.iframe.contentDocument;
      if (!iframeDoc) {
        setTimeout(setupEvents, 100);
        return;
      }

      // 點擊事件 - 選擇元素
      iframeDoc.addEventListener('click', (e) => {
        const target = e.target as Element;
        if (target.contentEditable !== 'true') {
          e.preventDefault();
          e.stopPropagation();
          this.selectElement(target);
        }
      }, true);

      // 雙擊事件 - 編輯文字
      iframeDoc.addEventListener('dblclick', (e) => {
        const target = e.target as HTMLElement;
        if (target && target !== iframeDoc.body && target !== iframeDoc.documentElement) {
          e.preventDefault();
          this.editElement(target);
        }
      }, true);

      // 右鍵菜單
      iframeDoc.addEventListener('contextmenu', (e) => {
        if (!this.selectedElement) return;
        e.preventDefault();
        this.showContextMenu(e as MouseEvent);
      }, true);

      // 鍵盤快捷鍵
      iframeDoc.addEventListener('keydown', (e) => {
        this.handleKeyboard(e as KeyboardEvent);
      }, true);

      // 內容修改
      iframeDoc.addEventListener('input', () => {
        this.syncToCode();
        this.saveHistory();
      });

      console.log('[WYSIWYG] 事件監聽已設置');
    };
    setupEvents();
  }

  // 選擇元素
  private selectElement(element: Element) {
    const iframeDoc = this.iframe.contentDocument;
    if (!iframeDoc) return;

    // 取消前一個選擇
    iframeDoc.querySelectorAll('[data-selected]').forEach(el => {
      el.removeAttribute('data-selected');
    });

    // 選擇新元素
    if (element && element !== iframeDoc.body && element !== iframeDoc.documentElement) {
      (element as HTMLElement).setAttribute('data-selected', '');
      this.selectedElement = element;
      console.log('[WYSIWYG] 已選擇:', element.tagName, element.textContent?.substring(0, 20));
    }
  }

  // 編輯元素文字
  private editElement(element: HTMLElement) {
    element.contentEditable = 'true';
    element.setAttribute('data-editable', '');
    element.focus();

    const onBlur = () => {
      element.contentEditable = 'false';
      element.removeAttribute('data-editable');
      this.syncToCode();
      this.saveHistory();
      element.removeEventListener('blur', onBlur);
    };

    element.addEventListener('blur', onBlur);
  }

  // 右鍵菜單
  private showContextMenu(event: MouseEvent) {
    if (!this.selectedElement) return;

    const iframeDoc = this.iframe.contentDocument;
    if (!iframeDoc) return;

    // 移除舊菜單
    const oldMenu = iframeDoc.getElementById('context-menu');
    oldMenu?.remove();

    // 建立新菜單
    const menu = iframeDoc.createElement('div');
    menu.id = 'context-menu';
    menu.style.cssText = `
      position: fixed;
      left: ${event.clientX}px;
      top: ${event.clientY}px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 10000;
      padding: 4px 0;
    `;

    const items = [
      { text: '複製', action: () => this.copyElement() },
      { text: '刪除', action: () => this.deleteElement() },
      { text: '上移', action: () => this.moveUp() },
      { text: '下移', action: () => this.moveDown() },
    ];

    items.forEach(item => {
      const btn = iframeDoc.createElement('div');
      btn.textContent = item.text;
      btn.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        user-select: none;
        border: none;
        background: transparent;
      `;
      btn.addEventListener('click', () => {
        item.action();
        menu.remove();
      });
      btn.addEventListener('mouseover', () => {
        btn.style.background = '#f0f0f0';
      });
      btn.addEventListener('mouseout', () => {
        btn.style.background = '';
      });
      menu.appendChild(btn);
    });

    iframeDoc.body.appendChild(menu);

    // 點擊其他地方時關閉菜單
    const closeMenu = () => {
      menu.remove();
      iframeDoc.removeEventListener('click', closeMenu);
    };
    iframeDoc.addEventListener('click', closeMenu);
  }

  // 複製元素
  private copyElement() {
    if (!this.selectedElement) return;
    const clone = this.selectedElement.cloneNode(true);
    const parent = this.selectedElement.parentElement;
    if (parent) {
      parent.insertBefore(clone, this.selectedElement.nextSibling);
      this.syncToCode();
      this.saveHistory();
      console.log('[WYSIWYG] 已複製元素');
    }
  }

  // 刪除元素
  private deleteElement() {
    if (!this.selectedElement) return;
    const iframeDoc = this.iframe.contentDocument;
    if (this.selectedElement === iframeDoc?.body || this.selectedElement === iframeDoc?.documentElement) {
      return;
    }
    this.selectedElement.remove();
    this.selectedElement = null;
    this.syncToCode();
    this.saveHistory();
    console.log('[WYSIWYG] 已刪除元素');
  }

  // 上移元素
  private moveUp() {
    if (!this.selectedElement?.previousElementSibling) return;
    const parent = this.selectedElement.parentElement;
    if (parent) {
      parent.insertBefore(this.selectedElement, this.selectedElement.previousElementSibling);
      this.syncToCode();
      this.saveHistory();
      console.log('[WYSIWYG] 已上移元素');
    }
  }

  // 下移元素
  private moveDown() {
    if (!this.selectedElement?.nextElementSibling) return;
    const parent = this.selectedElement.parentElement;
    if (parent) {
      parent.insertBefore(this.selectedElement.nextElementSibling, this.selectedElement);
      this.syncToCode();
      this.saveHistory();
      console.log('[WYSIWYG] 已下移元素');
    }
  }

  // 鍵盤快捷鍵
  private handleKeyboard(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'z':
          if (!event.shiftKey) {
            event.preventDefault();
            this.undo();
          }
          break;
        case 'y':
          event.preventDefault();
          this.redo();
          break;
      }
    }
  }

  // 歷史記錄
  private saveHistory() {
    const html = this.getHtml();
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(html);
    this.historyIndex++;
  }

  // 撤銷
  private undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.setHtml(this.history[this.historyIndex]);
      this.syncToCode();
      console.log('[WYSIWYG] 已撤銷');
    }
  }

  // 重做
  private redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.setHtml(this.history[this.historyIndex]);
      this.syncToCode();
      console.log('[WYSIWYG] 已重做');
    }
  }

  // 同步到程式碼編輯器
  private syncToCode() {
    const html = this.getHtml();
    this.codeEditor.value = html;
  }

  // 取得 HTML
  public getHtml(): string {
    const iframeDoc = this.iframe.contentDocument;
    return iframeDoc?.documentElement.outerHTML || '';
  }

  // 設置 HTML
  public setHtml(html: string) {
    const iframeDoc = this.iframe.contentDocument;
    if (iframeDoc) {
      try {
        iframeDoc.documentElement.innerHTML = html;
      } catch (e) {
        console.error('[WYSIWYG] 設置 HTML 失敗:', e);
      }
    }
  }

  // 從程式碼編輯器更新預覽
  public updateFromCode(html: string) {
    this.setHtml(html);
    this.history = [html];
    this.historyIndex = 0;
  }
}

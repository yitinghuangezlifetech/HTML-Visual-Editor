/**
 * Canvas - iframe srcdoc 管理，顯示 HTML 預覽
 */
export class Canvas {
  private iframe: HTMLIFrameElement;
  public onchange: (() => void) | null = null;
  private mutationObserver: MutationObserver | null = null;

  constructor() {
    this.iframe = document.getElementById('canvas') as HTMLIFrameElement;
    if (!this.iframe) {
      throw new Error('Canvas iframe not found');
    }
  }

  load(html: string) {
    // 停止舊的觀察
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }

    // 在 HTML 尾部注入一個不可見的標記，用於檢測變更
    // （iframe srcdoc 改變時會重新載入，所以我們監聽 body 內容）
    const injectedHtml = this.injectScripts(html);
    this.iframe.srcdoc = injectedHtml;

    // 等待 iframe 載入
    setTimeout(() => {
      this.setupIframeObserver();
    }, 100);
  }

  private injectScripts(html: string): string {
    // 如果沒有 body，加上
    if (!html.includes('<body')) {
      html = html.replace(
        '</head>',
        '</head><body></body>'
      );
    }

    // 在 body 尾部加上編輯檢測腳本
    const script = `<script>
      // 編輯檢測：當用戶在 iframe 內修改時回報給外部
      (function() {
        let currentHtml = document.documentElement.outerHTML;
        setInterval(() => {
          const newHtml = document.documentElement.outerHTML;
          if (newHtml !== currentHtml) {
            currentHtml = newHtml;
            parent.postMessage({ type: 'html-changed', html: newHtml }, '*');
          }
        }, 500);
      })();
    </script>`;

    return html.replace('</body>', script + '</body>');
  }

  private setupIframeObserver() {
    try {
      const iframeDoc = this.iframe.contentDocument;
      if (!iframeDoc || !iframeDoc.body) {
        return;
      }

      // 監聽 iframe 內 DOM 的變更
      this.mutationObserver = new MutationObserver(() => {
        if (this.onchange) {
          this.onchange();
        }
      });

      this.mutationObserver.observe(iframeDoc.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: false,
      });
    } catch (e) {
      // 跨域限制，無法直接觀察
      console.warn('Cannot observe iframe content:', e);
    }
  }

  getHtml(): string {
    try {
      const iframeDoc = this.iframe.contentDocument;
      if (iframeDoc && iframeDoc.documentElement) {
        let html = iframeDoc.documentElement.outerHTML;
        // 移除注入的檢測腳本
        html = html.replace(/<script>[\s\S]*?編輯檢測[\s\S]*?<\/script>/g, '');
        return html;
      }
    } catch (e) {
      console.error('Cannot get iframe HTML:', e);
    }
    return '';
  }

  destroy() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
  }
}

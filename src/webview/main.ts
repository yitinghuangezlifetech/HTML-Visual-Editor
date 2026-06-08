import { VsCodeApi } from './vscode-api';
import { Canvas } from './editor/Canvas';
import { HistoryManager } from './editor/HistoryManager';

class HtmlVisualEditor {
  private vscode = VsCodeApi.getInstance();
  private canvas: Canvas | null = null;
  private history = new HistoryManager();

  constructor() {
    try {
      if (!document.getElementById('canvas')) {
        throw new Error('Canvas element not found in DOM');
      }
      this.canvas = new Canvas();
      this.setupEventListeners();
      this.notifyReady();
      console.log('✓ HtmlVisualEditor initialized successfully');
    } catch (error) {
      console.error('✗ Failed to initialize editor:', error);
      this.displayError(String(error));
    }
  }

  private setupEventListeners() {
    // Listen for Host messages
    window.addEventListener('message', (event) => {
      const message = event.data;
      console.log('→ WebView received:', message.type);

      switch (message.type) {
        case 'init':
          this.onInit(message.payload);
          break;
        case 'revert':
          this.onRevert(message.payload);
          break;
        case 'error':
          this.onError(message.payload);
          break;
      }
    });

    // Toolbar buttons
    const saveBtn = document.getElementById('saveBtn');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');

    saveBtn?.addEventListener('click', () => this.save());
    undoBtn?.addEventListener('click', () => this.undo());
    redoBtn?.addEventListener('click', () => this.redo());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.save();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        this.redo();
      }
    });
  }

  private onInit(payload: { html: string; baseUri: string }) {
    if (!this.canvas) {
      this.displayError('Canvas not initialized');
      return;
    }
    console.log('→ Initializing editor with HTML');
    try {
      this.history.clear();
      this.canvas.load(payload.html);
      this.history.push(payload.html);

      this.canvas.onchange = () => {
        const currentHtml = this.canvas?.getHtml();
        if (currentHtml) {
          this.history.push(currentHtml);
        }
      };
    } catch (error) {
      this.displayError(`Load failed: ${error}`);
    }
  }

  private onRevert(payload: { html: string }) {
    console.log('→ Reverting to external changes');
    if (!this.canvas) return;
    if (confirm('File was changed externally. Reload editor?')) {
      this.history.clear();
      this.canvas.load(payload.html);
      this.history.push(payload.html);
    }
  }

  private onError(payload: { message: string }) {
    this.displayError(`Error: ${payload.message}`);
  }

  private save() {
    if (!this.canvas) return;
    const html = this.canvas.getHtml();
    this.vscode.postMessage({
      type: 'save',
      payload: { html },
    });
  }

  private undo() {
    if (!this.canvas) return;
    const prev = this.history.undo();
    if (prev !== null) {
      this.canvas.load(prev);
    }
  }

  private redo() {
    if (!this.canvas) return;
    const next = this.history.redo();
    if (next !== null) {
      this.canvas.load(next);
    }
  }

  private notifyReady() {
    this.vscode.postMessage({ type: 'ready' });
  }

  private displayError(message: string) {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    const firstChild = appDiv.firstChild;
    if (firstChild) {
      appDiv.insertBefore(errorDiv, firstChild);
    } else {
      appDiv.appendChild(errorDiv);
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired');
    new HtmlVisualEditor();
  });
} else {
  console.log('DOM already loaded, initializing immediately');
  new HtmlVisualEditor();
}

// 簡單版本 - 用於調試
console.log('=== Simple Editor Loaded ===');

// 檢查全局變量
console.log('acquireVsCodeApi:', typeof acquireVsCodeApi);
console.log('canvas element:', document.getElementById('canvas'));

try {
  const vscode = (window as any).acquireVsCodeApi();
  console.log('✓ VS Code API acquired');

  const canvas = document.getElementById('canvas') as HTMLIFrameElement;
  if (!canvas) {
    throw new Error('Canvas iframe not found');
  }
  console.log('✓ Canvas iframe found');

  // Test message to host
  vscode.postMessage({ type: 'ready', debug: 'simple editor loaded' });
  console.log('✓ Ready message sent');

  // Setup message listener
  window.addEventListener('message', (event) => {
    const msg = event.data;
    console.log('Message received:', msg.type);

    if (msg.type === 'init') {
      canvas.srcdoc = msg.payload.html;
      console.log('✓ HTML loaded to canvas');
    }
  });

  // Toolbar buttons
  document.getElementById('saveBtn')?.addEventListener('click', () => {
    vscode.postMessage({ type: 'save', payload: { html: canvas.innerText } });
    console.log('Save button clicked');
  });

  console.log('=== Simple Editor Ready ===');
} catch (error) {
  console.error('❌ Error:', error);
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `<div class="error"><h3>Error</h3><pre>${error}</pre></div>`;
  }
}

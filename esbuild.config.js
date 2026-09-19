const esbuild = require('esbuild');
const path = require('path');

const isWatch = process.argv.includes('--watch');

// Target 1: Extension Host (CommonJS, Node.js)
const hostConfig = {
  entryPoints: ['src/extension/extension.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  // 只有 vscode 與 Node 內建模組可 external：vsce 以 --no-dependencies 打包，
  // 不隨 vsix 附帶 node_modules，任何 external 的 npm 套件都會在執行期
  // MODULE_NOT_FOUND 導致擴充功能載入失敗（parse5 曾因此踩雷）。
  external: ['vscode', 'path'],
  outfile: 'dist/extension.js',
  sourcemap: true,
  tsconfig: 'tsconfig.json',
  mainFields: ['module', 'main'],
  minify: false,
  define: {
    'process.env.NODE_ENV': '"production"'
  }
};

// Target 2: WebView (IIFE, Browser)
const webviewConfig = {
  entryPoints: ['src/webview/main.ts'],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  outfile: 'media/editor-bundle.js',
  sourcemap: true,
  tsconfig: 'tsconfig.webview.json'
};

// Target 3: Rich Editor WebView (IIFE, Browser)
const richEditorConfig = {
  entryPoints: ['src/webview/rich-editor.ts'],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  outfile: 'media/rich-editor-bundle.js',
  sourcemap: true,
  tsconfig: 'tsconfig.webview.json',
  loader: { '.css': 'text' },
  minify: false,
};

(async () => {
  try {
    if (isWatch) {
      const hostCtx = await esbuild.context(hostConfig);
      const webviewCtx = await esbuild.context(webviewConfig);
      const richEditorCtx = await esbuild.context(richEditorConfig);

      console.log('Watching...');
      await Promise.all([
        hostCtx.watch(),
        webviewCtx.watch(),
        richEditorCtx.watch(),
      ]);
    } else {
      await Promise.all([
        esbuild.build(hostConfig),
        esbuild.build(webviewConfig),
        esbuild.build(richEditorConfig),
      ]);
      console.log('Build complete');
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

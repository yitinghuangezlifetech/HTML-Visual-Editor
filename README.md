# HTML Visual Editor

A VSCode extension that provides a WYSIWYG HTML editor with real-time preview, drag-and-drop layout, and component library support.

> 📖 完整規格與說明文件請見 [`spec/`](spec/README.md) 資料夾。

## Features (Roadmap)

### Phase 1 ✓ (In Progress)
- [x] Custom editor for .html files
- [x] Real-time preview in iframe
- [x] File save synchronization
- [x] Undo/Redo support

### Phase 2 (Planning)
- [ ] Visual element selection
- [ ] Selection overlay
- [ ] Text editing mode

### Phase 3 (Planning)
- [ ] Drag-and-drop reordering
- [ ] Component library
- [ ] Drag components to canvas

### Phase 4 (Planning)
- [ ] DOM tree inspector
- [ ] CSS style panel
- [ ] Element properties panel

## Development

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Watch

```bash
npm run watch
```

### Run

1. Press `F5` to open Extension Development Host
2. Open any `.html` file
3. Select "HTML Visual Editor" as the default editor

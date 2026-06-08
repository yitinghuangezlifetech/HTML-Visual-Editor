/**
 * HistoryManager - Undo/Redo 功能
 * 使用 HTML 字串快照堆棧實作
 */
export class HistoryManager {
  private stack: string[] = [];
  private cursor = -1;
  private maxStack = 50; // 限制最多保留 50 個狀態

  push(html: string) {
    // 如果 cursor 不在最後，刪除 redo 堆棧
    if (this.cursor < this.stack.length - 1) {
      this.stack.splice(this.cursor + 1);
    }

    // 避免連續相同的狀態
    if (this.stack[this.cursor] === html) {
      return;
    }

    this.stack.push(html);
    this.cursor++;

    // 限制堆棧大小
    if (this.stack.length > this.maxStack) {
      this.stack.shift();
      this.cursor--;
    }
  }

  undo(): string | null {
    if (this.cursor > 0) {
      this.cursor--;
      return this.stack[this.cursor];
    }
    return null;
  }

  redo(): string | null {
    if (this.cursor < this.stack.length - 1) {
      this.cursor++;
      return this.stack[this.cursor];
    }
    return null;
  }

  clear() {
    this.stack = [];
    this.cursor = -1;
  }

  canUndo(): boolean {
    return this.cursor > 0;
  }

  canRedo(): boolean {
    return this.cursor < this.stack.length - 1;
  }
}

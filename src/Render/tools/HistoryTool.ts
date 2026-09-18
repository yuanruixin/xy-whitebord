import { clone, debounce } from "lodash-es";
import Konva from "konva";
import type { ICanvasContext } from "../context";
export class HistoryTool {
  static readonly name = "HistoryTool";
  // 历史记录上限，避免快照（含 base64 图片）无限增长
  static readonly MAX = 100;
  config: {
    on?: {
      historyChange?: (history: string[], historyIndex: number) => void;
      selectionChange?: (selection: Konva.Node[]) => void;
      debugChange?: (v: boolean) => void;
    };
  } = {};
  render: ICanvasContext;
  history: string[] = [];
  historyIndex = -1;
  constructor(render: ICanvasContext) {
    this.render = render;
  }

  // 防抖自动保存，避免连续操作频繁写入本地存储
  private persist = debounce(() => {
    this.render.importExportTool.saveToLocalStorage();
  }, 400);

  prevHistory() {
    const record = this.history[this.historyIndex - 1];
    if (record) {
      this.render.importExportTool.restore(record, true);
      this.historyIndex--;
      this.persist();
      // 历史变化事件
      this.config.on?.historyChange?.(clone(this.history), this.historyIndex)
    }
  }

  nextHistory() {
    const record = this.history[this.historyIndex + 1];

    if (record) {
      this.render.importExportTool.restore(record, true)
      this.historyIndex++;
      this.persist();
      // 历史变化事件
      this.config.on?.historyChange?.(clone(this.history), this.historyIndex)
    }
  }

  // 重置历史，将当前画面作为唯一记录
  reset() {
    this.history = [];
    this.historyIndex = -1;
    this.updateHistory();
  }

  updateHistory() {
    this.history.splice(this.historyIndex + 1);
    this.history.push(this.render.importExportTool.save());

    // 超出上限时丢弃最旧的记录
    if (this.history.length > HistoryTool.MAX) {
      this.history.splice(0, this.history.length - HistoryTool.MAX);
    }

    this.historyIndex = this.history.length - 1;
    // 自动保存当前状态
    this.persist();
    // 历史变化事件
    this.config.on?.historyChange?.(
      clone(this.history),
      this.historyIndex
    );
  }
}

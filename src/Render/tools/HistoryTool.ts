import { debounce } from "lodash-es";
import { SceneHistory, type BoardElement } from "@/scene";
import type { ICanvasContext } from "../context";

export class HistoryTool {
  static readonly name = "HistoryTool";
  // 历史记录上限，超出后丢弃最旧记录
  static readonly MAX = SceneHistory.DEFAULT_LIMIT;

  config: {
    on?: {
      historyChange?: () => void;
    };
  } = {};
  render: ICanvasContext;

  // 增量历史：按元素记录，未变元素复用引用
  private history = new SceneHistory(HistoryTool.MAX);

  constructor(render: ICanvasContext) {
    this.render = render;
  }

  get canUndo() {
    return this.history.canUndo;
  }

  get canRedo() {
    return this.history.canRedo;
  }

  // 防抖自动保存，避免连续操作频繁写入本地存储
  private persist = debounce(() => {
    this.render.importExportTool.saveToLocalStorage();
  }, 400);

  // 记录当前画面
  updateHistory() {
    const elements = this.render.importExportTool.toSceneDocument().elements;
    this.history.record(elements);
    this.persist();
    // 历史变化事件
    this.config.on?.historyChange?.();
  }

  // 重置历史，将当前画面作为唯一记录
  reset() {
    const elements = this.render.importExportTool.toSceneDocument().elements;
    this.history.reset(elements);
    this.persist();
    this.config.on?.historyChange?.();
  }

  prevHistory() {
    const from = this.history.current;
    const target = this.history.undo();
    if (!from || !target) return;
    this.apply(from, target);
  }

  nextHistory() {
    const from = this.history.current;
    const target = this.history.redo();
    if (!from || !target) return;
    this.apply(from, target);
  }

  private apply(from: BoardElement[], target: BoardElement[]) {
    this.render.importExportTool.applyElements(from, target);
    this.persist();
    // 历史变化事件
    this.config.on?.historyChange?.();
  }
}

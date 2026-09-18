import { debounce } from "lodash-es";
import {
  SceneHistory,
  type BoardElement,
  type ElementId,
} from "@/scene";
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

  // 增量历史：按元素记录，未变元素复用引用，并保存选中状态
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

  // 当前选中的顶层元素 id
  private selectedIds(): ElementId[] {
    return this.render.selectionTool.selectingNodes
      .map((node) => node.id())
      .filter(Boolean);
  }

  // 记录当前画面
  updateHistory() {
    const elements = this.render.importExportTool.toSceneDocument().elements;
    this.history.record(elements, this.selectedIds());
    this.persist();
    // 历史变化事件
    this.config.on?.historyChange?.();
  }

  // 重置历史，将当前画面作为唯一记录
  reset() {
    const elements = this.render.importExportTool.toSceneDocument().elements;
    this.history.reset(elements, this.selectedIds());
    this.persist();
    this.config.on?.historyChange?.();
  }

  prevHistory() {
    const from = this.history.current;
    const entry = this.history.undo();
    if (!from || !entry) return;
    this.apply(from.elements, entry);
  }

  nextHistory() {
    const from = this.history.current;
    const entry = this.history.redo();
    if (!from || !entry) return;
    this.apply(from.elements, entry);
  }

  private apply(from: BoardElement[], entry: { elements: BoardElement[]; selectedIds: ElementId[] }) {
    this.render.importExportTool.applyElements(from, entry.elements);
    this.restoreSelection(entry.selectedIds);
    this.persist();
    // 历史变化事件
    this.config.on?.historyChange?.();
  }

  // 撤销 / 重做后恢复当时的选中状态
  private restoreSelection(ids: ElementId[]) {
    const selection = this.render.selectionTool;
    selection.selectingClear();
    if (ids.length === 0) return;

    const wanted = new Set(ids);
    const nodes = this.render.layer.getChildren(
      (node) => !this.render.ignore(node) && wanted.has(node.id())
    );
    if (nodes.length > 0) selection.select(nodes);
  }
}

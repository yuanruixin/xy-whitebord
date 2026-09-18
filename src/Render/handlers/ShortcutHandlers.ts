import type { ICanvasContext } from "../context";
import * as Types from "../types";

export class ShortcutHandlers implements Types.Handler {
  static readonly name = "Shortcut";

  private render: ICanvasContext;
  constructor(render: ICanvasContext) {
    this.render = render;
  }

  // 连续方向键微调时合并历史记录
  private nudgeTimer: ReturnType<typeof setTimeout> | null = null;

  private scheduleNudgeHistory() {
    if (this.nudgeTimer) clearTimeout(this.nudgeTimer);
    this.nudgeTimer = setTimeout(() => {
      this.render.historyTool.updateHistory();
      this.nudgeTimer = null;
    }, 300);
  }

  // 方向键微调选中元素（Shift 加速）
  private handleNudge(e: GlobalEventHandlersEventMap["keydown"]): boolean {
    if (e.ctrlKey || e.metaKey || e.altKey) return false;

    const step = e.shiftKey ? 10 : 1;
    let dx = 0;
    let dy = 0;
    switch (e.code) {
      case Types.MoveKey.up:
        dy = -step;
        break;
      case Types.MoveKey.down:
        dy = step;
        break;
      case Types.MoveKey.left:
        dx = -step;
        break;
      case Types.MoveKey.right:
        dx = step;
        break;
    }

    if (
      (dx === 0 && dy === 0) ||
      this.render.selectionTool.selectingNodes.length === 0
    ) {
      return false;
    }

    e.preventDefault();
    this.render.moveSelectedBy(dx, dy, false);
    this.scheduleNudgeHistory();
    return true;
  }

  handlers = {
    dom: {
      keydown: (e: GlobalEventHandlersEventMap["keydown"]) => {
        if (this.handleNudge(e)) return;

        // 其余快捷键统一由动作注册表派发
        const action = this.render.actions.match(e);
        if (!action) return;

        e.preventDefault();
        this.render.actions.run(action);
      },
    },
  };
}

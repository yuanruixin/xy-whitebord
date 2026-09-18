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

  handlers = {
    dom: {
      keydown: (e: GlobalEventHandlersEventMap["keydown"]) => {
        // 方向键微调选中元素（Shift 加速）
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
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
            (dx !== 0 || dy !== 0) &&
            this.render.selectionTool.selectingNodes.length > 0
          ) {
            e.preventDefault();
            this.render.moveSelectedBy(dx, dy, false);
            this.scheduleNudgeHistory();
            return;
          }
        }

        if (e.ctrlKey || e.metaKey) {
          if (e.code === Types.ShortcutKey.C) {
            this.render.copyTool.pasteStart();
          } else if (e.code === Types.ShortcutKey.V) {
            this.render.copyTool.pasteEnd();
          } else if (e.code === Types.ShortcutKey.Z) {
            this.render.historyTool.prevHistory();
          } else if (e.code === Types.ShortcutKey.Y) {
            this.render.historyTool.nextHistory();
          } else if (e.code === Types.ShortcutKey.A) {
            this.render.selectionTool.selectAll();
            this.render.workMode("select");
          } else if (e.code === Types.ShortcutKey.G) {
            // Ctrl/Cmd + G 成组，加 Shift 解组
            if (e.shiftKey) {
              this.render.groupTool.ungroup();
            } else {
              this.render.groupTool.group();
            }
          } else if (e.code === Types.ShortcutKey.R) {
            window.location.reload();
          }
        } else if (
          e.code === Types.ShortcutKey.Delete ||
          e.code === Types.ShortcutKey.Backspace
        ) {
          this.render.deleteSelectingElement();
        } else if (e.code === Types.ShortcutKey.Esc) {
          this.render.selectionTool.selectingClear();
        }
      },
    },
  };
}

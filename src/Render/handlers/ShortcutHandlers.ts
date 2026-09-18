import type { ICanvasContext } from "../context";
import * as Types from "../types";

export class ShortcutHandlers implements Types.Handler {
  static readonly name = "Shortcut";

  private render: ICanvasContext;
  constructor(render: ICanvasContext) {
    this.render = render;
  }

  handlers = {
    dom: {
      keydown: (e: GlobalEventHandlersEventMap["keydown"]) => {
        if (e.ctrlKey || e.metaKey) {
          if (e.code === Types.ShortcutKey.C) {
            this.render.copyTool.pasteStart();
          } else if (e.code === Types.ShortcutKey.V) {
            this.render.copyTool.pasteEnd();
          } else if (e.code === Types.ShortcutKey.Z) {
            this.render.historyTool.prevHistory();
          } else if (e.code === Types.ShortcutKey.Y) {
            console.log("redo");
            this.render.historyTool.nextHistory();
          } else if (e.code === Types.ShortcutKey.A) {
            this.render.selectionTool.selectAll();
            this.render.workMode("select");
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

import { Render } from "../index";
import * as Types from "../types";

export class ShutcutHandlers implements Types.Handler {
  static readonly name = "Shutcut";

  private render: Render;
  constructor(render: Render) {
    this.render = render;
  }

  handlers = {
    dom: {
      keydown: (e: GlobalEventHandlersEventMap["keydown"]) => {
        if (e.ctrlKey || e.metaKey) {
          if (e.code === Types.ShutcutKey.C) {
            this.render.copyTool.pasteStart();
          } else if (e.code === Types.ShutcutKey.V) {
            this.render.copyTool.pasteEnd();
          } else if (e.code === Types.ShutcutKey.Z) {
            this.render.historyTool.prevHistory();
          } else if (e.code === Types.ShutcutKey.Y) {
            console.log("redo");
            this.render.historyTool.nextHistory();
          } else if (e.code === Types.ShutcutKey.A) {
            this.render.selectionTool.selectAll();
            this.render.workMode("select");
          } else if (e.code === Types.ShutcutKey.R) {
            window.location.reload();
          }
        } else if (
          e.code === Types.ShutcutKey.Delete ||
          e.code === Types.ShutcutKey.Backspace
        ) {
          this.render.deleteSelectingElement();
        } else if (e.code === Types.ShutcutKey.Esc) {
          this.render.selectionTool.selectingClear();
        }
      },
    },
  };
}

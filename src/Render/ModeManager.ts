import type { ICanvasContext } from "./context";
import type { MouseMode } from "./types";
import type { PaintTool } from "./tools/PaintTool";

export type Mode = MouseMode;

/**
 * 工作模式状态机：同一时间鼠标只能处理一种事件
 * （创建元素、画笔、橡皮、选择、拖拽、文本）。
 * 切换时负责清理旧工具、初始化新工具。
 */
export class ModeManager {
  private mode: Mode = "select";

  constructor(private ctx: ICanvasContext) {}

  get current(): Mode {
    return this.mode;
  }

  switch<T extends Mode>(
    next?: T,
    config?: T extends "brush" ? PaintTool.InitPaintConfig : undefined
  ): Mode {
    if (!next) return this.mode;
    if (next === this.mode) return next;

    this.exit(this.mode);
    this.mode = next;
    this.enter(next, config as PaintTool.InitPaintConfig | undefined);

    return this.mode;
  }

  private exit(old: Mode) {
    const { ctx } = this;
    switch (old) {
      case "createElement":
        ctx.shape.destroy();
        break;
      case "brush":
        ctx.paintTool.destroy();
        break;
      case "eraser":
        ctx.eraserTool.destroy();
        break;
      case "connector":
        ctx.connectorTool.destroy();
        break;
      case "select":
      case "default":
        ctx.selectionTool.selectingClear();
        break;
      case "createText":
        ctx.text.destroy();
        break;
      case "drag":
        ctx.stage.draggable(false);
        ctx.cursor.reset();
        break;
    }
  }

  private enter(next: Mode, config?: PaintTool.InitPaintConfig) {
    const { ctx } = this;
    switch (next) {
      case "drag":
        ctx.stage.draggable(true);
        ctx.cursor.set("grab");
        break;
      case "brush":
        ctx.paintTool.init(config!);
        ctx.cursor.set("brush");
        break;
      case "eraser":
        ctx.eraserTool.init();
        break;
      case "connector":
        ctx.connectorTool.init();
        break;
      case "createText":
        ctx.cursor.set("crosshair");
        break;
      default:
        ctx.cursor.reset();
        break;
    }
  }
}

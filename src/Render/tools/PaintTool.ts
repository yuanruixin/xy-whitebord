import Konva from "konva";
import { createPaintElement } from "@/scene";
import type { ICanvasContext } from "../context";
import { throttle } from "@/utils/throttle";
type PaintMode = "brush" | "eraser";

export declare namespace PaintTool {
  interface InitPaintConfig {
    color?: string;
    mode?: PaintMode;
    lineWidth?: number;
    lineStyle?: "dotted" | "solid";
  }
}

export class PaintTool {
  static readonly name = "SelectionTool";
  isPaint = false;
  render: ICanvasContext;
  currentLine: Konva.Line | null = null;
  constructor(render: ICanvasContext) {
    this.render = render;
  }

  init(config: PaintTool.InitPaintConfig) {
    this.render.events.on("paintTool", "stage", "mousedown touchstart", () => {
      this.isPaint = true;
      const pos = this.render.stage.getPointerPosition();

      if (!pos) return;
      const stageState = this.render.getStageState();
      const x = this.render.toStageValue(pos.x - stageState.x);
      const y = this.render.toStageValue(pos.y - stageState.y);

      const strokeWidth = config?.lineWidth ?? 1;
      const element = createPaintElement({
        points: [x, y, x, y],
        stroke: config?.color ?? "black",
        strokeWidth,
        dash:
          config?.lineStyle === "dotted"
            ? [strokeWidth * 4, strokeWidth * 2]
            : undefined,
        globalCompositeOperation:
          this.render.workMode() === "brush"
            ? "source-over"
            : "destination-out",
      });

      // 通过模型创建节点；绘制过程中直接改点，结束时再统一记录历史
      const group = this.render.createElement(element, { record: false });
      this.currentLine = group.findOne("Line") as Konva.Line | null;
    });

    this.render.events.on("paintTool", "stage", "mouseup touchend", () => {
      this.isPaint = false;
      this.render.historyTool.updateHistory();
    });

    this.render.events.on(
      "paintTool",
      "stage",
      "mousemove touchmove",
      throttle((e) => {
        if (!this.isPaint || !this.currentLine) return;
        e.evt.preventDefault();
        const pos = this.render.stage.getPointerPosition();
        if (!pos) return;
        const stageState = this.render.getStageState();

        const x = this.render.toStageValue(pos.x - stageState.x);
        const y = this.render.toStageValue(pos.y - stageState.y);
        const newPoints = this.currentLine.points().concat([x, y]);

        this.currentLine!.points(newPoints);
      }, 10)
    );
  }

  destroy() {
    this.render.events.off("paintTool");
    this.render.cursor.reset();
  }
}

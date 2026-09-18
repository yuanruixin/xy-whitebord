import Konva from "konva";
import { nanoid } from "nanoid";
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

      this.currentLine = new Konva.Line({
        stroke: config?.color ?? "black",
        strokeWidth: config?.lineWidth ?? 1,
        globalCompositeOperation:
          this.render.workMode() === "brush"
            ? "source-over"
            : "destination-out",
        lineCap: "round",
        lineJoin: "round",
        points: [x, y, x, y],
      });
      if (config?.lineStyle === "dotted") {
        this.currentLine.dash([
          this.currentLine.strokeWidth() * 4,
          this.currentLine.strokeWidth() * 2,
        ]);
      }
      const group = new Konva.Group({
        id: nanoid(),
        name: "paint",
      });
      group.add(this.currentLine);
      this.render.layer.add(group);
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

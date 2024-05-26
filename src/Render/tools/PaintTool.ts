import Konva from "konva";
//
import { Render } from "../index";

type PaintMode = "brush" | "eraser";
export class PaintTool {
  static readonly name = "SelectionTool";
  _color = "black";
  isPaint = false;
  _mode: PaintMode = "brush";
  render: Render;
  currentLine: Konva.Line | null = null;
  constructor(render: Render) {
    this.render = render;
  }

  init() {
    this.render.mouseMode("brush");
    this.render.stage.on("mousedown.paintTool touchstart.paintTool", () => {
      this.isPaint = true;
      const pos = this.render.stage.getPointerPosition();

      if (!pos) return;
      const stageState = this.render.getStageState();
      const x = this.render.toStageValue(pos.x - stageState.x);
      const y = this.render.toStageValue(pos.y - stageState.y);
      console.log(x, y);

      this.currentLine = new Konva.Line({
        stroke: this.color(),
        strokeWidth: 5,
        globalCompositeOperation:
          this.mode() === "brush" ? "source-over" : "destination-out",
        lineCap: "round",
        lineJoin: "round",
        points: [x, y, x, y],
      });
      this.render.layer.add(this.currentLine);
    });

    this.render.stage.on("mouseup.paintTool touchend.paintTool", () => {
      this.isPaint = false;
    });

    this.render.stage.on("mousemove.paintTool touchmove.paintTool", (e) => {
      if (!this.isPaint || !this.currentLine) return;
      e.evt.preventDefault();
      const pos = this.render.stage.getPointerPosition();
      if (!pos) return;
      const stageState = this.render.getStageState();

      const x = this.render.toStageValue(pos.x - stageState.x);
      const y = this.render.toStageValue(pos.y - stageState.y);
      const newPoints = this.currentLine.points().concat([x, y]);
      
      this.currentLine!.points(newPoints);
    });

  }

  mode(mode?: PaintMode) {
    if (mode) {
      this._mode = mode;
    }
    return this._mode;
  }
  color(color?: string) {
    if (color) {
      this._color = color;
    }
    return this._color;
  }
  // 开启绘制
  destroy() {
    this.removeEvents();
    this.render.cursor.reset();
  }

  removeEvents() {
    this.render.stage.off("mousedown.paintTool touchstart.paintTool");
    this.render.stage.off("mouseup.paintTool touchend.paintTool");
    this.render.stage.off("mousemove.paintTool touchmove.paintTool");
  }
}

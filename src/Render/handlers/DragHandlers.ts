import Konva from "konva";

import { Render } from "../index";
import * as Types from "../types";
import { throttle } from "@/utils/throttle";

export class DragHandlers {
  static readonly name = "Drag";

  private render: Render;
  constructor(render: Render) {
    this.render = render;
  }

  // 是否结束移动
  mousedownLeft = false;
  totalMoveDistanceTillRedraw = { x: 0, y: 0 };
  // 右键按下 stage 位置
  mousedownStagePos = { x: 0, y: 0 };
  // 右键按下位置
  mousedownPointerPos = { x: 0, y: 0 };

  handlers = {
    stage: {
      mousedown: (
        e: Konva.KonvaEventObject<GlobalEventHandlersEventMap["mousedown"]>
      ) => {
        if (this.render.workMode() !== "drag") {
          this.render.stage.draggable(false);
        } else {
          // 鼠标左键
          if (e.evt.button == Types.MouseButton.left) {
            this.mousedownLeft = true;
            this.render.stage.draggable(true);
            // stage 状态
            const stageState = this.render.getStageState();
            this.mousedownStagePos = { x: stageState.x, y: stageState.y };
            const pos = this.render.stage.getPointerPosition();
            if (pos) {
              this.mousedownPointerPos = { x: pos.x, y: pos.y };
            }
          }
        }
      },
      mouseup: () => {
        this.mousedownLeft = false;
      },
      dragmove: throttle((e: Konva.KonvaEventObject<DragEvent>) => {
        const isMouseInCanvas = () => {
          const containerBox = this.render.stage
            .container()
            .getBoundingClientRect();
          const mouseX = e.evt.clientX;
          const mouseY = e.evt.clientY;
          return (
            mouseX >= containerBox.left &&
            mouseX <= containerBox.right &&
            mouseY >= containerBox.top &&
            mouseY <= containerBox.bottom
          );
        };
        if (!isMouseInCanvas()) {
          this.mousedownLeft = false;
          this.render.stage.draggable(false);
        }
        if (this.isStageDraggable && this.mousedownLeft) {
          // 鼠标左键拖动
          const pos = this.render.stage.getPointerPosition();
          if (pos) {
            // const offsetX = pos.x - this.mousedownPointerPos.x;
            // const offsetY = pos.y - this.mousedownPointerPos.y;

            // 移动 stage
            // this.render.stage.position({
            //   x: this.mousedownStagePos.x + offsetX,
            //   y: this.mousedownStagePos.y + offsetY,
            // });

            // 更新背景
            this.render.draws.bg.draw();
          }
        }
      }, 10),
    },
  } satisfies Types.Handler["handlers"];
  get isStageDraggable() {
    return this.render.workMode() === "drag";
  }
}

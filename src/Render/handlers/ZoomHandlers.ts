import Konva from "konva";
import { Render } from "../index";
import * as Types from "../types";

export class ZoomHandlers implements Types.Handler {
  static readonly name = "Zoom";

  private render: Render;
  constructor(render: Render) {
    this.render = render;
  }

  // zoom 速度
  scaleBy = 0.1;
  // zoom 范围
  scaleMin = 0.1;
  scaleMax = 4;

  handlers= {
    stage: {
      wheel: (
        e: Konva.KonvaEventObject<GlobalEventHandlersEventMap["wheel"]>
      ) => {
        // stage 状态
        const stageState = this.render.getStageState();

        const oldScale = stageState.scale;

        const pos = this.render.stage.getPointerPosition();
        if (pos) {
          const mousePointTo = {
            x: (pos.x - stageState.x) / oldScale,
            y: (pos.y - stageState.y) / oldScale,
          };

          // 滚轮方向
          const direction = e.evt.deltaY < 0 ? 1 : -1;

          let newScale =
            direction > 0 ? oldScale + this.scaleBy : oldScale - this.scaleBy;
          if (newScale > this.scaleMax) newScale = this.scaleMax;
          if (newScale < this.scaleMin) newScale = this.scaleMin;
          
          // 缩放 stage
          this.render.setStageScale(newScale)

          // 移动 stage
          this.render.stage.position({
            x: pos.x - mousePointTo.x * newScale,
            y: pos.y - mousePointTo.y * newScale,
          });
          
        }
      },
    },
  } satisfies Types.Handler["handlers"];
}

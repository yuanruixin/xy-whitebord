import Konva from "konva";
import type { ICanvasContext } from "../context";
import * as Types from "../types";

export class ZoomHandlers implements Types.Handler {
  static readonly name = "Zoom";

  private render: ICanvasContext;
  constructor(render: ICanvasContext) {
    this.render = render;
  }

  // 缩放速度：每单位 deltaY 对应的缩放增量（线性叠加，而非倍数）
  zoomSpeed = 0.01;
  // 单次事件最大缩放增量，避免鼠标滚轮/触控板加速度造成跳变
  zoomStepMax = 0.1;
  // zoom 范围
  scaleMin = 0.1;
  scaleMax = 4;
  // 滚轮行高换算（deltaMode 为行/页时需要换算为像素）
  lineHeight = 16;
  pageHeight = 100;

  private normalizeDelta(e: WheelEvent) {
    if (e.deltaMode === 1) return e.deltaY * this.lineHeight;
    if (e.deltaMode === 2) return e.deltaY * this.pageHeight;
    return e.deltaY;
  }

  handlers = {
    stage: {
      wheel: (
        e: Konva.KonvaEventObject<GlobalEventHandlersEventMap["wheel"]>
      ) => {
        const evt = e.evt;
        // 阻止浏览器默认的页面缩放/滚动
        evt.preventDefault();

        // stage 状态
        const stageState = this.render.getStageState();

        // Mac 触控板双指捏合 / Ctrl + 滚轮 → 缩放
        if (evt.ctrlKey) {
          const oldScale = stageState.scale;

          const pos = this.render.stage.getPointerPosition();
          if (!pos) return;

          const mousePointTo = {
            x: (pos.x - stageState.x) / oldScale,
            y: (pos.y - stageState.y) / oldScale,
          };

          // 依据滚动量线性微调缩放（例如 50% → 51%），而非倍数增加
          const deltaY = this.normalizeDelta(evt);
          let zoomStep = -deltaY * this.zoomSpeed;
          if (zoomStep > this.zoomStepMax) zoomStep = this.zoomStepMax;
          if (zoomStep < -this.zoomStepMax) zoomStep = -this.zoomStepMax;

          let newScale = oldScale + zoomStep;
          if (newScale > this.scaleMax) newScale = this.scaleMax;
          if (newScale < this.scaleMin) newScale = this.scaleMin;

          // 缩放 stage
          this.render.setStageScale(newScale);

          // 以鼠标位置为中心移动 stage
          this.render.stage.position({
            x: pos.x - mousePointTo.x * newScale,
            y: pos.y - mousePointTo.y * newScale,
          });
          return;
        }

        // Mac 触控板双指滑动 → 平移画布
        const deltaX = evt.deltaX;
        const deltaY = this.normalizeDelta(evt);
        if (deltaX === 0 && deltaY === 0) return;

        this.render.stage.position({
          x: stageState.x - deltaX,
          y: stageState.y - deltaY,
        });

        // 更新背景
        this.render.draws.bg.draw();
      },
    },
  } satisfies Types.Handler["handlers"];
}

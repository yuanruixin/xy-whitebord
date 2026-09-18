import Konva from "konva";
import type { ICanvasContext } from "../context";
import { MouseButton } from "../types";
import { throttle } from "@/utils/throttle";

/**
 * 橡皮擦（对象擦除）：
 * 按住左键在元素上拖动，划过的高层元素会被删除。
 * 一次「按下 - 拖动 - 抬起」只记录一条历史，可整体撤销。
 */
export class EraserTool {
  static readonly name = "EraserTool";

  private render: ICanvasContext;
  // 是否正在擦除
  private erasing = false;
  // 本次擦除已删除的节点，避免重复处理
  private erasedIds = new Set<string>();
  // 悬浮高亮框
  private hoverRect: Konva.Rect;

  constructor(render: ICanvasContext) {
    this.render = render;
    this.hoverRect = new Konva.Rect({
      id: "hoverRect",
      listening: false,
      visible: false,
      stroke: "#4e95ff",
      dash: [6, 4],
      strokeWidth: 2,
      fill: "rgba(78,149,255,0.08)",
    });
    this.render.layerCover.add(this.hoverRect);
  }

  init() {
    // 擦除前清空选择与颜色工具
    this.render.selectionTool.selectingClear();
    this.render.editToolbar.close();
    this.render.cursor.setEraser();

    this.render.events.on(
      "eraserTool",
      "stage",
      "mousedown touchstart",
      this.onDown
    );
    this.render.events.on(
      "eraserTool",
      "stage",
      "mousemove touchmove",
      throttle(this.onMove, 16)
    );
    this.render.events.on("eraserTool", "stage", "mouseup touchend", this.onUp);
    // 拖出画布时结束本次擦除
    this.render.events.on("eraserTool", "dom", "mouseleave", this.onUp);
  }

  destroy() {
    this.render.events.off("eraserTool");
    this.erasing = false;
    this.erasedIds.clear();
    this.hoverRect.visible(false);
    this.render.cursor.reset();
  }

  // 命中 layer 的顶层元素（元素根 group）
  private targetAt(): Konva.Group | null {
    const pos = this.render.stage.getPointerPosition();
    if (!pos) return null;

    const hit = this.render.layer.getIntersection(pos);
    if (!hit) return null;

    let current: Konva.Node | null = hit;
    while (current && current.getParent() !== this.render.layer) {
      current = current.getParent();
    }

    if (!current || this.render.ignore(current)) return null;
    return current as Konva.Group;
  }

  private eraseAt() {
    const target = this.targetAt();
    if (!target) return;

    const id = target._id.toString();
    if (this.erasedIds.has(id)) return;

    this.erasedIds.add(id);
    target.remove();
  }

  // 更新悬浮高亮
  private updateHover() {
    const target = this.targetAt();
    if (!target) {
      this.hoverRect.visible(false);
      return;
    }

    const box = target.getClientRect();
    this.hoverRect.setAttrs({
      x: this.render.toStageValue(box.x - this.render.stage.x()),
      y: this.render.toStageValue(box.y - this.render.stage.y()),
      width: this.render.toStageValue(box.width),
      height: this.render.toStageValue(box.height),
      strokeWidth: this.render.toStageValue(2),
      visible: true,
    });
  }

  private onDown = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>
  ) => {
    const evt = e.evt as MouseEvent;
    if (typeof evt.button === "number" && evt.button !== MouseButton.left) {
      return;
    }

    this.erasing = true;
    this.erasedIds.clear();
    this.eraseAt();
    this.hoverRect.visible(false);
  };

  private onMove = () => {
    if (this.erasing) {
      this.eraseAt();
    } else {
      this.updateHover();
    }
  };

  private onUp = () => {
    if (!this.erasing) return;
    this.erasing = false;

    if (this.erasedIds.size > 0) {
      this.render.historyTool.updateHistory();
    }
    // 抬起后恢复悬浮高亮
    this.updateHover();
  };
}

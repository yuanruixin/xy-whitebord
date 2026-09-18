import Konva from "konva";
import { nanoid } from "nanoid";
import type { ICanvasContext } from "../context";
import { MouseButton } from "../types";

// 连接线端点：绑定图形时以「图形中心 + 偏移」记录，未绑定时记录 board 坐标
interface ConnectorEnd {
  nodeId?: string;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
}

/**
 * 连接线 / 绑定箭头。
 * 拖拽绘制一条带箭头的直线；起点或终点落在图形上时自动绑定，
 * 图形移动/缩放时端点跟随。
 */
export class ConnectorTool {
  static readonly name = "ConnectorTool";
  private static readonly COLOR = "#1d293a";

  private render: ICanvasContext;
  private drawing = false;
  private startEnd: ConnectorEnd | null = null;
  // 绘制中的预览箭头
  private preview: Konva.Arrow | null = null;

  constructor(render: ICanvasContext) {
    this.render = render;
  }

  // 监听图形变换，刷新所有连接线（在 Render.init 中调用）
  initEvents() {
    const refresh = () => this.refreshAll();
    this.render.transformer.on(
      "dragmove.connector transform.connector transformend.connector dragend.connector",
      refresh
    );
  }

  // 进入连接线模式
  init() {
    this.render.selectionTool.selectingClear();
    this.render.editToolbar.close();
    this.render.cursor.set("crosshair");

    this.render.events.on(
      "connectorTool",
      "stage",
      "mousedown touchstart",
      this.onDown
    );
    this.render.events.on(
      "connectorTool",
      "stage",
      "mousemove touchmove",
      this.onMove
    );
    this.render.events.on(
      "connectorTool",
      "stage",
      "mouseup touchend",
      this.onUp
    );
  }

  destroy() {
    this.render.events.off("connectorTool");
    this.cancel();
    this.render.cursor.reset();
  }

  // 刷新所有连接线端点
  refreshAll() {
    const layer = this.render.layer;
    const connectors = layer.find(".connector") as Konva.Group[];
    for (const group of connectors) {
      this.refreshConnector(group);
    }
  }

  private refreshConnector(group: Konva.Group) {
    const ends = group.getAttr("ends") as ConnectorEnd[] | undefined;
    const arrow = group.children[0] as Konva.Arrow | undefined;
    if (!ends || !arrow) return;

    const gx = group.x();
    const gy = group.y();
    // 未绑定的端点保持当前局部坐标（保证拖动/粘贴生效）
    const points = [...arrow.points()];
    let changed = false;

    ends.forEach((end, i) => {
      if (!end.nodeId) return;
      const node = this.findElement(end.nodeId);
      if (!node) return;
      const center = this.centerOf(node);
      points[i * 2] = center.x + end.offsetX - gx;
      points[i * 2 + 1] = center.y + end.offsetY - gy;
      changed = true;
    });

    if (changed) arrow.points(points);
  }

  private cancel() {
    this.drawing = false;
    this.startEnd = null;
    this.preview?.destroy();
    this.preview = null;
  }

  private boardPointer(): Konva.Vector2d | null {
    return this.render.stage.getRelativePointerPosition();
  }

  private findElement(id: string): Konva.Node | null {
    const list = this.render.layer.getChildren((n) => n.id() === id);
    return list[0] ?? null;
  }

  // 顶层图形中心（board 坐标）
  private centerOf(node: Konva.Node): Konva.Vector2d {
    const box = node.getClientRect({ relativeTo: this.render.layer });
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }

  // 指针下的顶层图形（排除连接线自身）
  private elementAt(): Konva.Group | null {
    const pos = this.render.stage.getPointerPosition();
    if (!pos) return null;
    const hit = this.render.layer.getIntersection(pos);
    if (!hit) return null;

    let node: Konva.Node | null = hit;
    while (node && node.getParent() !== this.render.layer) {
      node = node.getParent();
    }
    if (!node || this.render.ignore(node) || node.name() === "connector") {
      return null;
    }
    return node as Konva.Group;
  }

  private makeEnd(boardPos: Konva.Vector2d): ConnectorEnd {
    const node = this.elementAt();
    if (node) {
      const center = this.centerOf(node);
      return {
        nodeId: node.id(),
        offsetX: boardPos.x - center.x,
        offsetY: boardPos.y - center.y,
        x: boardPos.x,
        y: boardPos.y,
      };
    }
    return { offsetX: 0, offsetY: 0, x: boardPos.x, y: boardPos.y };
  }

  private createConnector(start: ConnectorEnd, end: ConnectorEnd) {
    const group = new Konva.Group({ id: nanoid(), name: "connector" });
    const arrow = new Konva.Arrow({
      points: [start.x, start.y, end.x, end.y],
      stroke: ConnectorTool.COLOR,
      fill: ConnectorTool.COLOR,
      strokeWidth: 2,
      pointerLength: 10,
      pointerWidth: 10,
    });
    group.add(arrow);
    group.setAttr("ends", [start, end]);
    this.render.layer.add(group);
  }

  private onDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const evt = e.evt as MouseEvent;
    if (typeof evt.button === "number" && evt.button !== MouseButton.left) return;

    const pos = this.boardPointer();
    if (!pos) return;

    this.drawing = true;
    this.startEnd = this.makeEnd(pos);

    this.preview = new Konva.Arrow({
      points: [pos.x, pos.y, pos.x, pos.y],
      stroke: ConnectorTool.COLOR,
      fill: ConnectorTool.COLOR,
      strokeWidth: 2,
      pointerLength: 10,
      pointerWidth: 10,
      dash: [6, 4],
      listening: false,
    });
    this.render.layerCover.add(this.preview);
  };

  private onMove = () => {
    if (!this.drawing || !this.preview || !this.startEnd) return;
    const pos = this.boardPointer();
    if (!pos) return;
    this.preview.points([this.startEnd.x, this.startEnd.y, pos.x, pos.y]);
  };

  private onUp = () => {
    if (!this.drawing || !this.startEnd) return;

    const pos = this.boardPointer();
    const start = this.startEnd;
    this.cancel();
    if (!pos) return;

    // 距离过短不创建
    if (Math.hypot(pos.x - start.x, pos.y - start.y) < 5) return;

    this.createConnector(start, this.makeEnd(pos));
    this.render.historyTool.updateHistory();
  };
}

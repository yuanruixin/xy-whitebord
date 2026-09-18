import Konva from "konva";
import { nanoid } from "nanoid";
import type { ICanvasContext } from "../context";
import { MouseButton } from "../types";
import { ANCHORS, anchorPoint, getAnchor } from "../utils/anchors";
import type { Anchor, Rect } from "../utils/anchors";

// 连接线端点：绑定图形时以「图形中心 + 偏移」记录，未绑定时记录 board 坐标
interface ConnectorEnd {
  nodeId?: string;
  // 吸附到图形的关键锚点（存在时按锚点实时计算，忽略 offset）
  anchor?: string;
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
  // 端点吸附到锚点的屏幕像素阈值
  private static readonly SNAP_PX = 24;

  private render: ICanvasContext;
  private drawing = false;
  private startEnd: ConnectorEnd | null = null;
  // 绘制中的预览箭头
  private preview: Konva.Arrow | null = null;
  // 选中连接线时显示的端点手柄
  private handles: Konva.Circle[] = [];
  private activeConnector: Konva.Group | null = null;

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
    // 手柄跟随端点
    if (this.activeConnector) this.positionHandles();
  }

  // ===== 端点编辑手柄 =====

  // 根据当前选中刷新端点手柄（仅单选连接线时显示）
  updateHandles() {
    const nodes = this.render.selectionTool.selectingNodes;
    const connector =
      nodes.length === 1 && nodes[0].name() === "connector"
        ? (nodes[0] as Konva.Group)
        : null;

    if (connector === this.activeConnector) {
      if (connector) this.positionHandles();
      return;
    }

    this.clearHandles();
    if (!connector) return;

    this.activeConnector = connector;
    const ends = connector.getAttr("ends") as ConnectorEnd[] | undefined;
    if (!ends) return;

    ends.forEach((_, index) => {
      const circle = new Konva.Circle({
        name: "connector-handle",
        radius: this.render.toStageValue(5),
        fill: "#ffffff",
        stroke: "#4e95ff",
        strokeWidth: this.render.toStageValue(2),
        draggable: true,
      });
      circle.on("dragmove", () => this.onHandleDragMove(index, circle));
      circle.on("dragend", () => this.onHandleDragEnd(index));
      circle.on("mouseenter", () => this.render.cursor.setMove());
      circle.on("mouseleave", () => this.render.cursor.reset());
      this.handles.push(circle);
      this.render.layerCover.add(circle);
    });
    this.positionHandles();
  }

  private clearHandles() {
    this.handles.forEach((circle) => circle.destroy());
    this.handles = [];
    this.activeConnector = null;
  }

  private positionHandles() {
    const group = this.activeConnector;
    if (!group) return;
    const arrow = group.children[0] as Konva.Arrow | undefined;
    if (!arrow) return;

    const points = arrow.points();
    const gx = group.x();
    const gy = group.y();
    const radius = this.render.toStageValue(5);
    const strokeWidth = this.render.toStageValue(2);

    this.handles.forEach((circle, index) => {
      circle.position({
        x: gx + points[index * 2],
        y: gy + points[index * 2 + 1],
      });
      circle.radius(radius);
      circle.strokeWidth(strokeWidth);
    });
  }

  private onHandleDragMove(index: number, circle: Konva.Circle) {
    const group = this.activeConnector;
    if (!group) return;
    const arrow = group.children[0] as Konva.Arrow | undefined;
    if (!arrow) return;

    // 靠近图形时吸附到最近的关键锚点
    const boardPos = this.boardPointer();
    const snap = boardPos ? this.snapTarget(boardPos) : null;
    const point = snap ? snap.point : { x: circle.x(), y: circle.y() };
    if (snap) circle.position(point);

    // 拖动时先解除绑定，落点再决定是否重新绑定
    const ends = group.getAttr("ends") as ConnectorEnd[];
    ends[index] = { offsetX: 0, offsetY: 0, x: point.x, y: point.y };
    group.setAttr("ends", ends);

    const points = [...arrow.points()];
    points[index * 2] = point.x - group.x();
    points[index * 2 + 1] = point.y - group.y();
    arrow.points(points);
    // 同步选择框
    this.render.transformer.forceUpdate();
  }

  private onHandleDragEnd(index: number) {
    const group = this.activeConnector;
    if (!group) return;

    const ends = group.getAttr("ends") as ConnectorEnd[];
    const end = ends[index];

    // 落点靠近图形则吸附到最近锚点并绑定
    const boardPos = this.boardPointer();
    const snap = boardPos ? this.snapTarget(boardPos) : null;

    if (snap) {
      end.nodeId = snap.node.id();
      end.anchor = snap.anchor.id;
      end.offsetX = 0;
      end.offsetY = 0;
      end.x = snap.point.x;
      end.y = snap.point.y;
    } else {
      // 未吸附：落在图形上则按相对偏移绑定，否则保持自由端点
      const node = this.elementAt();
      if (node) {
        const center = this.centerOf(node);
        end.nodeId = node.id();
        end.anchor = undefined;
        end.offsetX = end.x - center.x;
        end.offsetY = end.y - center.y;
      } else {
        end.nodeId = undefined;
        end.anchor = undefined;
        end.offsetX = 0;
        end.offsetY = 0;
      }
    }
    group.setAttr("ends", ends);

    this.refreshConnector(group);
    this.positionHandles();
    this.render.historyTool.updateHistory();
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
      const point = this.endPoint(end);
      if (!point) return;
      points[i * 2] = point.x - gx;
      points[i * 2 + 1] = point.y - gy;
      changed = true;
    });

    if (changed) arrow.points(points);
  }

  // 解析端点在画布中的位置（锚点优先，其次中心 + 偏移）
  private endPoint(end: ConnectorEnd): Konva.Vector2d | null {
    if (!end.nodeId) return null;
    const node = this.findElement(end.nodeId);
    if (!node) return null;

    if (end.anchor) {
      const anchor = getAnchor(end.anchor);
      if (anchor) return anchorPoint(this.layerRectOf(node), anchor);
    }

    const center = this.centerOf(node);
    return { x: center.x + end.offsetX, y: center.y + end.offsetY };
  }

  // 顶层图形在 layer 坐标系下的包围盒
  private layerRectOf(node: Konva.Node): Rect {
    return node.getClientRect({ relativeTo: this.render.layer });
  }

  /**
   * 查找指针附近的图形锚点，用于连线时自动吸附。
   * 当指针落在图形（含阈值扩张）范围内，返回距离最近的关键锚点。
   */
  private snapTarget(boardPos: Konva.Vector2d): {
    node: Konva.Group;
    anchor: Anchor;
    point: Konva.Vector2d;
  } | null {
    const threshold = this.render.toStageValue(ConnectorTool.SNAP_PX);
    let best: { node: Konva.Group; anchor: Anchor; point: Konva.Vector2d } | null =
      null;
    let bestDistance = Infinity;

    const nodes = this.render.layer.getChildren(
      (node) => !this.render.ignore(node) && node.name() !== "connector"
    );

    for (const node of nodes) {
      const rect = this.layerRectOf(node);
      const outside =
        boardPos.x < rect.x - threshold ||
        boardPos.x > rect.x + rect.width + threshold ||
        boardPos.y < rect.y - threshold ||
        boardPos.y > rect.y + rect.height + threshold;
      if (outside) continue;

      for (const anchor of ANCHORS) {
        const point = anchorPoint(rect, anchor);
        const distance = Math.hypot(
          point.x - boardPos.x,
          point.y - boardPos.y
        );
        if (distance < bestDistance) {
          bestDistance = distance;
          best = { node: node as Konva.Group, anchor, point };
        }
      }
    }

    return best;
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
    // 优先吸附到指针附近的关键锚点
    const snap = this.snapTarget(boardPos);
    if (snap) {
      return {
        nodeId: snap.node.id(),
        anchor: snap.anchor.id,
        offsetX: 0,
        offsetY: 0,
        x: snap.point.x,
        y: snap.point.y,
      };
    }

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
    return group;
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
    // 预览时同样吸附到附近锚点，方便对齐
    const snap = this.snapTarget(pos);
    const end = snap ? snap.point : pos;
    this.preview.points([this.startEnd.x, this.startEnd.y, end.x, end.y]);
  };

  private onUp = () => {
    if (!this.drawing || !this.startEnd) return;

    const pos = this.boardPointer();
    const start = this.startEnd;
    this.cancel();
    if (!pos) return;

    // 距离过短不创建
    if (Math.hypot(pos.x - start.x, pos.y - start.y) < 5) return;

    const group = this.createConnector(start, this.makeEnd(pos));
    // 自动选中刚创建的连接线，方便直接移动
    this.render.selectionTool.select([group]);
    this.render.historyTool.updateHistory();
    // 绘制完成退出连接线模式，切回选择状态
    this.render.workMode("select");
    this.render.onToolFinish?.();
  };
}

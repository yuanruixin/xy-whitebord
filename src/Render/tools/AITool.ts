import Konva from "konva";
import { nanoid } from "nanoid";
import pathData from "../Element/Shape/pathData.json";
import type { ShapeType } from "../Element/Shape";
import type { ICanvasContext } from "../context";
import type { AIScene, AISceneNode } from "@/utils/ai";

// AI 节点类型 -> 内置形状
const TYPE_TO_SHAPE: Partial<Record<AISceneNode["type"], ShapeType>> = {
  rectangle: "rectangle",
  ellipse: "ellipse",
  diamond: "diamond",
  triangle: "triangleUp",
  parallelogram: "parallelogramRight",
  arrow: "arrowRight",
};

const SHAPE_PATHS: { [k in ShapeType]: string } = pathData;

const DEFAULT_SHAPE_FILL = "#4e95ff";
const DEFAULT_TEXT_FILL = "#1d293a";
const LABEL_FILL = "#1d293a";

/**
 * AI 生成工具：把 AI 返回的简化场景描述转换为画布节点。
 * 形状复用内置 SVG path，连接线复用连接线节点结构（可跟随图形移动）。
 */
export class AITool {
  static readonly name = "AITool";
  private render: ICanvasContext;

  constructor(render: ICanvasContext) {
    this.render = render;
  }

  generate(scene: AIScene) {
    this.render.selectionTool.selectingClear();

    const groups = new Map<string, Konva.Group>();

    for (const node of scene.nodes) {
      const group =
        node.type === "text" ? this.createText(node) : this.createShape(node);
      if (!group) continue;
      this.render.layer.add(group);
      if (node.id) groups.set(node.id, group);
    }

    for (const edge of scene.edges ?? []) {
      this.createEdge(edge.from, edge.to, groups);
    }

    if (groups.size > 0) {
      this.render.connectorTool.refreshAll();
      this.render.historyTool.updateHistory();
    }
  }

  private createShape(data: AISceneNode): Konva.Group | null {
    const shapeType = TYPE_TO_SHAPE[data.type];
    if (!shapeType) return null;

    const width = data.width ?? 160;
    const height = data.height ?? 80;
    const group = new Konva.Group({ id: nanoid(), name: "shape" });
    const path = new Konva.Path({
      data: SHAPE_PATHS[shapeType],
      fill: data.fill ?? DEFAULT_SHAPE_FILL,
    });

    // 按目标宽高缩放 path，并让包围盒左上角对齐到 (x, y)
    const box = path.getClientRect();
    const scaleX = width / (box.width || 1);
    const scaleY = height / (box.height || 1);
    path.setAttrs({
      x: -box.x * scaleX,
      y: -box.y * scaleY,
      scaleX,
      scaleY,
    });
    group.add(path);
    group.position({ x: data.x, y: data.y });

    if (data.text) {
      const label = new Konva.Text({
        name: "shape-label",
        text: data.text,
        align: "center",
        fontSize: data.fontSize ?? 20,
        fill: LABEL_FILL,
        listening: false,
      });
      group.add(label);
      this.render.text.layoutShapeLabel(group, label);
    }

    return group;
  }

  private createText(data: AISceneNode): Konva.Group {
    const group = new Konva.Group({ id: nanoid(), name: "text" });
    const textNode = new Konva.Text({
      text: data.text ?? "文本",
      fontSize: data.fontSize ?? 20,
      fill: data.fill ?? DEFAULT_TEXT_FILL,
    });
    group.add(textNode);
    group.position({ x: data.x, y: data.y });
    return group;
  }

  private createEdge(
    fromId: string,
    toId: string,
    groups: Map<string, Konva.Group>
  ) {
    const from = groups.get(fromId);
    const to = groups.get(toId);
    if (!from || !to) return;

    const start = this.centerOf(from);
    const end = this.centerOf(to);

    const group = new Konva.Group({ id: nanoid(), name: "connector" });
    const arrow = new Konva.Arrow({
      points: [start.x, start.y, end.x, end.y],
      stroke: DEFAULT_TEXT_FILL,
      fill: DEFAULT_TEXT_FILL,
      strokeWidth: 2,
      pointerLength: 10,
      pointerWidth: 10,
    });
    group.add(arrow);
    group.setAttr("ends", [
      { nodeId: from.id(), offsetX: 0, offsetY: 0, x: start.x, y: start.y },
      { nodeId: to.id(), offsetX: 0, offsetY: 0, x: end.x, y: end.y },
    ]);
    this.render.layer.add(group);
  }

  // 节点中心（layer 坐标）
  private centerOf(node: Konva.Node): Konva.Vector2d {
    const box = node.getClientRect({ relativeTo: this.render.layer });
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }
}

import Konva from "konva";
import { nanoid } from "nanoid";
import pathData from "../Element/Shape/pathData.json";
import type { ShapeType } from "../Element/Shape";
import type { ICanvasContext } from "../context";
import { nearestAnchorPair } from "../utils/anchors";
import type { Rect } from "../utils/anchors";
import type {
  AISceneEdge,
  AISceneNode,
  CanvasExecutor,
  CanvasNodeInfo,
  CanvasToolResult,
  ConnectNodesArgs,
  CreateNodesArgs,
  DeleteNodesArgs,
  MoveNodesArgs,
  UpdateNodesArgs,
} from "@/utils/ai";

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
const LABEL_FONT_SIZE = 20;

/**
 * 画布操作工具：把「创建 / 移动 / 删除 / 修改 / 连线 / 读取」等能力封装为
 * 与 AI 无关的画布命令，实现 CanvasExecutor 端口。AI 模块通过该端口操作画布，
 * 因此可以独立于 Konva 与渲染实现复用。
 */
export class CanvasCommandTool implements CanvasExecutor {
  static readonly name = "CanvasCommandTool";

  private render: ICanvasContext;
  constructor(render: ICanvasContext) {
    this.render = render;
  }

  // ===== 工具：创建节点（含连接线） =====
  createNodes({ nodes, edges }: CreateNodesArgs): CanvasToolResult {
    this.render.selectionTool.selectingClear();

    const groups = new Map<string, Konva.Group>();
    const idMap: Record<string, string> = {};
    let created = 0;

    for (const node of nodes) {
      const group =
        node.type === "text" ? this.createText(node) : this.createShape(node);
      if (!group) continue;
      this.render.layer.add(group);
      const clientId = node.id || `n${created}`;
      idMap[clientId] = group.id();
      groups.set(clientId, group);
      groups.set(group.id(), group);
      created++;
    }

    let edgeCount = 0;
    for (const edge of edges ?? []) {
      if (this.connectEdge(edge, groups)) edgeCount++;
    }

    if (created > 0) {
      this.render.connectorTool.refreshAll();
      this.render.historyTool.updateHistory();
    }

    return {
      ok: created > 0,
      message:
        created > 0
          ? `已创建 ${created} 个节点、${edgeCount} 条连接线`
          : "未能创建节点，请检查图形类型",
      data: { created, edges: edgeCount, idMap },
    };
  }

  // ===== 工具：连接已有节点 =====
  connectNodes({ edges }: ConnectNodesArgs): CanvasToolResult {
    let edgeCount = 0;
    const notFound: string[] = [];

    for (const edge of edges) {
      const from = this.findById(edge.from);
      const to = this.findById(edge.to);
      if (!from || !to) {
        if (!from) notFound.push(edge.from);
        if (!to) notFound.push(edge.to);
        continue;
      }
      if (this.connectEdge(edge, new Map())) edgeCount++;
    }

    if (edgeCount > 0) {
      this.render.connectorTool.refreshAll();
      this.render.historyTool.updateHistory();
    }

    return {
      ok: edgeCount > 0,
      message:
        edgeCount > 0
          ? `已创建 ${edgeCount} 条连接线`
          : "未创建连接线，请确认节点 id 是否存在",
      data: { edges: edgeCount, notFound },
    };
  }

  // ===== 工具：移动节点 =====
  moveNodes({ moves }: MoveNodesArgs): CanvasToolResult {
    const moved: string[] = [];
    const notFound: string[] = [];

    for (const move of moves) {
      const node = this.findById(move.id);
      if (!node) {
        notFound.push(move.id);
        continue;
      }
      const x =
        typeof move.x === "number"
          ? move.x
          : typeof move.dx === "number"
            ? node.x() + move.dx
            : node.x();
      const y =
        typeof move.y === "number"
          ? move.y
          : typeof move.dy === "number"
            ? node.y() + move.dy
            : node.y();
      node.position({ x, y });
      moved.push(move.id);
    }

    if (moved.length > 0) {
      this.render.transformer.forceUpdate();
      this.render.connectorTool.refreshAll();
      this.render.historyTool.updateHistory();
    }

    return {
      ok: moved.length > 0,
      message:
        moved.length > 0
          ? `已移动 ${moved.length} 个节点`
          : "未移动任何节点，请确认节点 id 是否存在",
      data: { moved, notFound },
    };
  }

  // ===== 工具：修改文字 / 颜色 =====
  updateNodes({ updates }: UpdateNodesArgs): CanvasToolResult {
    const updated: string[] = [];
    const notFound: string[] = [];

    for (const update of updates) {
      const group = this.findById(update.id);
      if (!group) {
        notFound.push(update.id);
        continue;
      }
      if (typeof update.text === "string") this.setText(group, update.text);
      if (typeof update.fill === "string") this.setFill(group, update.fill);
      updated.push(update.id);
    }

    if (updated.length > 0) {
      this.render.transformer.forceUpdate();
      this.render.historyTool.updateHistory();
    }

    return {
      ok: updated.length > 0,
      message:
        updated.length > 0
          ? `已更新 ${updated.length} 个节点`
          : "未更新任何节点，请确认节点 id 是否存在",
      data: { updated, notFound },
    };
  }

  // ===== 工具：删除节点 =====
  deleteNodes({ ids }: DeleteNodesArgs): CanvasToolResult {
    // 先取消选择，避免 transformer 仍引用被删除的节点
    this.render.selectionTool.selectingClear();

    const removed: string[] = [];
    const notFound: string[] = [];

    for (const id of ids) {
      const node = this.findById(id);
      if (!node) {
        notFound.push(id);
        continue;
      }
      node.remove();
      removed.push(id);
    }

    if (removed.length > 0) {
      this.render.connectorTool.refreshAll();
      this.render.historyTool.updateHistory();
    }

    return {
      ok: removed.length > 0,
      message:
        removed.length > 0
          ? `已删除 ${removed.length} 个节点`
          : "未删除任何节点，请确认节点 id 是否存在",
      data: { removed, notFound },
    };
  }

  // ===== 工具：读取画布 =====
  getCanvas(): CanvasToolResult {
    return {
      ok: true,
      message: this.describeCanvas(),
      data: { nodes: this.nodeInfos(this.topNodes()) },
    };
  }

  // 当前选中的元素信息（供 UI / AI 引用选中图形使用）
  getSelection(): CanvasNodeInfo[] {
    return this.nodeInfos(this.render.selectionTool.selectingNodes);
  }

  // ===== 画布描述（供 system prompt 使用） =====

  /**
   * 描述当前画布内容与可见区域，供模型布局时避免与已有元素重叠。
   */
  describeCanvas(): string {
    const nodes = this.topNodes();

    const stage = this.render.stage;
    const scale = stage.scaleX() || 1;
    const view = {
      x: -stage.x() / scale,
      y: -stage.y() / scale,
      width: stage.width() / scale,
      height: stage.height() / scale,
    };
    const viewText = `当前可见区域（画布坐标）：x:[${Math.round(
      view.x
    )}, ${Math.round(view.x + view.width)}], y:[${Math.round(
      view.y
    )}, ${Math.round(view.y + view.height)}]。`;

    if (nodes.length === 0) {
      return `${viewText}\n当前画布为空，可直接在可见区域内布局。`;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const items: string[] = [];

    for (const node of nodes.slice(0, 60)) {
      const rect = this.layerRectOf(node);
      minX = Math.min(minX, rect.x);
      minY = Math.min(minY, rect.y);
      maxX = Math.max(maxX, rect.x + rect.width);
      maxY = Math.max(maxY, rect.y + rect.height);
      const label = this.labelOf(node);
      items.push(
        `- id=${node.id()} ${this.nodeTypeOf(node)}${
          label ? ` 「${label}」` : ""
        }: x=${Math.round(rect.x)}, y=${Math.round(rect.y)}, w=${Math.round(
          rect.width
        )}, h=${Math.round(rect.height)}`
      );
    }

    return [
      viewText,
      `当前画布已有 ${nodes.length} 个元素，占用区域（画布坐标）：`,
      ...items,
      `整体范围：x:[${Math.round(minX)}, ${Math.round(
        maxX
      )}], y:[${Math.round(minY)}, ${Math.round(maxY)}]。`,
      "新图形必须避开上述占用区域；优先放在可见区域内的空白处，空间不足时放到已有元素的下方或右侧。",
    ].join("\n");
  }

  // ===== 内部实现 =====

  private topNodes(): Konva.Node[] {
    return this.render.layer.getChildren((node) => !this.render.ignore(node));
  }

  // 把节点映射为带类型、文字、位置、尺寸的信息
  private nodeInfos(nodes: Konva.Node[]): CanvasNodeInfo[] {
    return nodes.map((node) => {
      const rect = this.layerRectOf(node);
      return {
        id: node.id(),
        type: this.nodeTypeOf(node),
        label: this.labelOf(node),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    });
  }

  private findById(id: string): Konva.Group | null {
    const list = this.render.layer.getChildren((node) => node.id() === id);
    return (list[0] as Konva.Group) ?? null;
  }

  /**
   * 解析节点的具体类型。形状 group 的 name 统一为 "shape"，
   * 真实形状（矩形/圆形/菱形…）只体现在子 Path 的 SVG 数据里，
   * 因此这里通过 path data 反查 ShapeType，供 AI 识别画布元素。
   */
  private nodeTypeOf(node: Konva.Node): string {
    if (node.name() !== "shape" || !(node instanceof Konva.Container)) {
      return node.name();
    }
    const path = node.children.find(
      (child) => child instanceof Konva.Path
    ) as Konva.Path | undefined;
    if (path) {
      const data = path.data();
      for (const key of Object.keys(SHAPE_PATHS) as ShapeType[]) {
        if (SHAPE_PATHS[key] === data) return key;
      }
    }
    return "shape";
  }

  private connectEdge(
    edge: AISceneEdge,
    groups: Map<string, Konva.Group>
  ): boolean {
    const from = groups.get(edge.from) ?? this.findById(edge.from);
    const to = groups.get(edge.to) ?? this.findById(edge.to);
    if (!from || !to) return false;
    this.createEdge(from, to);
    return true;
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
    group.position({ x: data.x ?? 120, y: data.y ?? 120 });

    if (data.text) {
      const label = new Konva.Text({
        name: "shape-label",
        text: data.text,
        align: "center",
        fontSize: data.fontSize ?? LABEL_FONT_SIZE,
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
      fontSize: data.fontSize ?? LABEL_FONT_SIZE,
      fill: data.fill ?? DEFAULT_TEXT_FILL,
    });
    group.add(textNode);
    group.position({ x: data.x ?? 120, y: data.y ?? 120 });
    return group;
  }

  private createEdge(from: Konva.Node, to: Konva.Node): Konva.Group {
    // 选择两图形间距离最近的一对关键锚点作为连线端点
    const { from: fromAnchor, to: toAnchor, fromPoint, toPoint } =
      nearestAnchorPair(this.layerRectOf(from), this.layerRectOf(to));

    const group = new Konva.Group({ id: nanoid(), name: "connector" });
    const arrow = new Konva.Arrow({
      points: [fromPoint.x, fromPoint.y, toPoint.x, toPoint.y],
      stroke: DEFAULT_TEXT_FILL,
      fill: DEFAULT_TEXT_FILL,
      strokeWidth: 2,
      pointerLength: 10,
      pointerWidth: 10,
    });
    group.add(arrow);
    group.setAttr("ends", [
      {
        nodeId: from.id(),
        anchor: fromAnchor.id,
        offsetX: 0,
        offsetY: 0,
        x: fromPoint.x,
        y: fromPoint.y,
      },
      {
        nodeId: to.id(),
        anchor: toAnchor.id,
        offsetX: 0,
        offsetY: 0,
        x: toPoint.x,
        y: toPoint.y,
      },
    ]);
    this.render.layer.add(group);
    return group;
  }

  private setText(group: Konva.Group, text: string) {
    if (group.name() === "text") {
      const node = group.children.find((child) => child instanceof Konva.Text);
      if (node instanceof Konva.Text) node.text(text);
      return;
    }

    const existing = group.findOne(".shape-label") as Konva.Text | null;
    if (existing) {
      existing.text(text);
      this.render.text.layoutShapeLabel(group, existing);
      return;
    }

    const label = new Konva.Text({
      name: "shape-label",
      text,
      align: "center",
      fontSize: LABEL_FONT_SIZE,
      fill: LABEL_FILL,
      listening: false,
    });
    group.add(label);
    this.render.text.layoutShapeLabel(group, label);
  }

  private setFill(group: Konva.Group, fill: string) {
    if (group.name() === "text") {
      const node = group.children.find((child) => child instanceof Konva.Text);
      if (node instanceof Konva.Text) node.fill(fill);
      return;
    }

    const path = group.children.find(
      (child) => child instanceof Konva.Path
    ) as Konva.Path | undefined;
    if (path) path.fill(fill);
  }

  // 节点在 layer 坐标系下的包围盒
  private layerRectOf(node: Konva.Node): Rect {
    return node.getClientRect({ relativeTo: this.render.layer });
  }

  private labelOf(node: Konva.Node): string {
    if (!(node instanceof Konva.Container)) return "";
    for (const child of node.getChildren()) {
      if (child instanceof Konva.Text) {
        const text = child.text().trim();
        if (text) return text.slice(0, 20);
      }
      const nested = this.labelOf(child);
      if (nested) return nested;
    }
    return "";
  }
}

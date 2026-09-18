import Konva from "konva";
//
import type { ICanvasContext } from "../context";
import { isTextNode } from "../utils/elementJudgment";
export class SelectionTool {
  static readonly name = "SelectionTool";

  private render: ICanvasContext;
  constructor(render: ICanvasContext) {
    this.render = render;
  }

  // 【被选中的】
  _selectingNodes: Konva.Node[] = [];

  // 清空已选
  selectingClear() {
    // 清空选择
    this.render.transformer.nodes([]);

    // 恢复透明度、层次、可交互
    for (const node of this.selectingNodes.sort(
      (a, b) => a.attrs.lastZIndex - b.attrs.lastZIndex
    )) {
      node.setAttrs({
        listening: true,
        opacity: node.attrs.lastOpacity ?? 1,
        zIndex: node.attrs.lastZIndex,
      });
    }
    // 清空状态
    for (const node of this.selectingNodes) {
      node.setAttrs({
        nodeMousedownPos: undefined,
        lastOpacity: undefined,
        lastZIndex: undefined,
        selectingZIndex: undefined,
      });
    }

    // 清空选择节点
    this.selectingNodes = [];
  }
  set selectingNodes(nodes: Konva.Node[]) {
    if (nodes.length === 1 && isTextNode(nodes[0])) {
      this.render.transformer.enabledAnchors(["middle-left", "middle-right"]);
    } else {
      this.render.transformer.enabledAnchors(
        ['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right']);
    }
    this._selectingNodes = nodes;
  }
  get selectingNodes() {
    return this._selectingNodes;
  }
  // 选择节点
  select(nodes: Konva.Node[]) {
    // 选之前，清一下
    this.selectingClear();

    if (nodes.length > 0) {
      // 记录状态
      for (const node of nodes) {
        node.setAttrs({
          nodeMousedownPos: node.position(), // 后面用于移动所选
          lastOpacity: node.opacity(), // 选中时，下面会使其变透明，记录原有的透明度
          lastZIndex: node.zIndex(), // 记录原有的层次，后面暂时提升所选节点的层次
        });
      }

      // 选中的节点
      this.selectingNodes = nodes;

      this.render.transformer.nodes(this.selectingNodes);
    }
  }

  selectAll() {
    const nodeNames = [".text", ".shape", ".image", ".paint", ".connector"];
    const nodes: Konva.Node[][] = [];
    nodeNames.forEach((name) => {
      nodes.push(this.render.layer.find(name) as Konva.Node[]);
    });

    this.select(nodes.flat());
  }
}

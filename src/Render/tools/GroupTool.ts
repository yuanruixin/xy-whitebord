import Konva from "konva";
import { nanoid } from "nanoid";
import type { ICanvasContext } from "../context";

/**
 * 成组 / 解组。
 * 成组：把当前选中的顶层元素放入一个新的 group 容器；
 * 解组：把 group 的子元素还原到画布，并把 group 的变换烘焙进子元素。
 */
export class GroupTool {
  static readonly name = "GroupTool";

  private render: ICanvasContext;
  constructor(render: ICanvasContext) {
    this.render = render;
  }

  // 当前选中的顶层元素
  private selectedTopNodes(): Konva.Node[] {
    const layer = this.render.layer;
    return this.render.selectionTool.selectingNodes.filter(
      (node) => node.getParent() === layer
    );
  }

  // 成组
  group() {
    const selected = this.selectedTopNodes();
    if (selected.length < 2) return;

    // 按层级排序，成组后保持原有前后顺序
    const sorted = [...selected].sort((a, b) => a.zIndex() - b.zIndex());
    const topIndex = sorted[sorted.length - 1].zIndex();

    this.render.selectionTool.selectingClear();

    const group = new Konva.Group({ id: nanoid(), name: "group" });
    this.render.layer.add(group);
    // group 放到原先最上层元素的位置
    group.zIndex(topIndex);

    for (const node of sorted) {
      node.moveTo(group);
    }

    this.render.selectionTool.select([group]);
    this.render.connectorTool.refreshAll();
    this.render.historyTool.updateHistory();
  }

  // 解组
  ungroup() {
    const selected = this.selectedTopNodes().filter(
      (node) => node.name() === "group"
    );
    if (selected.length === 0) return;

    this.render.selectionTool.selectingClear();

    const freed: Konva.Node[] = [];
    for (const node of selected) {
      const group = node as Konva.Group;
      // getTransform() 返回的是节点缓存的 Transform，multiply 会就地修改，需先 copy
      const groupTransform = group.getTransform().copy();
      const children = group.getChildren().slice();
      const baseIndex = group.zIndex();

      children.forEach((child) => {
        // 把 group 的变换叠加到子元素上，保持视觉位置不变
        const local = groupTransform.copy().multiply(child.getTransform());
        const { x, y, scaleX, scaleY, rotation, skewX, skewY } =
          local.decompose();

        child.moveTo(this.render.layer);
        child.setAttrs({ x, y, scaleX, scaleY, rotation, skewX, skewY });
        freed.push(child);
      });

      // 按原顺序放回 group 所在层级
      children.forEach((child, index) => child.zIndex(baseIndex + index));
      group.destroy();
    }

    this.render.selectionTool.select(freed);
    this.render.connectorTool.refreshAll();
    this.render.historyTool.updateHistory();
  }

  // 是否存在可成组的选中（用于菜单展示）
  canGroup() {
    return this.selectedTopNodes().length >= 2;
  }

  // 是否存在可解组的选中
  canUngroup() {
    return this.selectedTopNodes().some((node) => node.name() === "group");
  }
}

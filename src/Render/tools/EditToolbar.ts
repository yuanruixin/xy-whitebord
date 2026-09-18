import type { ICanvasContext } from "../context";
import Konva from "konva";
import { PickColor } from "@/components/ColorPicker";
export class EditToolbar {
  render: ICanvasContext;
  constructor(render: ICanvasContext) {
    this.render = render;
  }
  // 初始化编辑工具条
  init() {
    this.initPickColorToolbar();
  }
  initPickColorToolbar() {
    const selectingNodes = this.render.selectionTool.selectingNodes;

    if (selectingNodes.length === 0) {
      PickColor.close();
      return;
    }

    const transformerBound = this.render.transformer.getClientRect();

    const pos = {
      x: transformerBound.x,
      y: transformerBound.y - 20,
    };
    // 边界处理防止超出屏幕
    if (pos.y <= 10) {
      pos.y = pos.y + transformerBound.height;
    }

    // 存储颜色列表，取最新的两个显示
    const colors: string[] = [];
    selectingNodes.forEach((item) => {
      if (item instanceof Konva.Group) {
        item.children.forEach((node) => {
          if (node instanceof Konva.Line) {
            colors.push(node.stroke());
          } else if (node instanceof Konva.Path || node instanceof Konva.Text) {
            // 图形
            colors.push(node.fill());
          }
        });
      }
    });

    // 仅选中单个文本节点时，提供字号设置
    const isSingleText =
      selectingNodes.length === 1 && selectingNodes[0].name() === "text";
    const textNode = isSingleText
      ? ((selectingNodes[0] as Konva.Group).children[0] as Konva.Text)
      : null;

    if (colors.length === 0 && !textNode) return;

    // 设置颜色
    PickColor(
      {
        defaultColor: colors[0] || "red",
        pos,
        fontSize: textNode?.fontSize(),
        onFontSize: textNode
          ? (size: number) => this.setTextFontSize(textNode, size)
          : undefined,
      },
      (color) => {
        selectingNodes.forEach((item) => {
          if (!(item instanceof Konva.Group)) return;
          item.children.forEach((node) => {
            if (node instanceof Konva.Line) {
              node.stroke(color);
              // 连接线箭头：同步箭头填充色
              if (node instanceof Konva.Arrow) {
                node.fill(color);
              }
            } else if (node instanceof Konva.Path) {
              node.fill(color);
            } else if (node instanceof Konva.Text) {
              node.fill(color);
              if (this.render.text.textarea) {
                this.render.text.textarea.style.color = color;
              }
            }
          });
        });
        this.render.historyTool.updateHistory();
      }
    );
  }

  // 设置选中文本的字号
  setTextFontSize(textNode: Konva.Text, size: number) {
    if (!Number.isFinite(size) || size <= 0) return;

    textNode.fontSize(size);

    // 正在编辑时同步 textarea
    const textarea = this.render.text.textarea;
    if (textarea) {
      textarea.style.fontSize = size + "px";
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + 3 + "px";
    }

    this.render.transformer.forceUpdate();
    this.render.historyTool.updateHistory();
  }

  close() {
    PickColor.close();
  }
}

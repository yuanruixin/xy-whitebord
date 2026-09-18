import Konva from "konva";
import type { ICanvasContext } from "../context";
import {
  setSelectionStyle,
  type DashStyle,
  type SelectionStyle,
  type TextAlign,
} from "@/store/selectionStyle";

const DEFAULT_COLOR = "#4e95ff";
const DEFAULT_STROKE = "#1d293a";

/**
 * 选中元素的样式读写。属性面板通过它获取当前值并应用修改。
 */
export class StyleTool {
  static readonly name = "StyleTool";

  private render: ICanvasContext;
  constructor(render: ICanvasContext) {
    this.render = render;
  }

  private get nodes() {
    return this.render.selectionTool.selectingNodes;
  }

  private eachChild(cb: (child: Konva.Node) => void) {
    for (const node of this.nodes) {
      if (node instanceof Konva.Group) {
        node.children.forEach(cb);
      }
    }
  }

  // 读取当前选中样式（以第一个元素类型为准）
  getStyle(): Partial<SelectionStyle> {
    const nodes = this.nodes;
    if (nodes.length === 0) return { visible: false };

    const first = nodes[0];
    const name = first.name();
    const patch: Partial<SelectionStyle> = {
      visible: true,
      opacity: Math.round((first.opacity() ?? 1) * 100),
      color: null,
      strokeColor: null,
      strokeWidth: null,
      dash: null,
      fontSize: null,
      fontFamily: null,
      bold: false,
      italic: false,
      align: "left",
    };

    const child = first instanceof Konva.Group ? first.children[0] : first;
    if (!child) return patch;

    if (name === "shape") {
      const path = child as Konva.Path;
      patch.color = (path.fill() as string) || DEFAULT_COLOR;
      patch.strokeColor = (path.stroke() as string) || DEFAULT_STROKE;
      // 未描边时宽度显示为 0
      patch.strokeWidth = path.stroke() ? path.strokeWidth() : 0;
      patch.dash = this.readDash(path);
    } else if (name === "connector" || name === "paint") {
      const line = child as Konva.Line;
      patch.color = (line.stroke() as string) || DEFAULT_STROKE;
      patch.strokeWidth = line.strokeWidth();
      patch.dash = this.readDash(line);
    } else if (name === "text") {
      const text = child as Konva.Text;
      patch.color = (text.fill() as string) || DEFAULT_STROKE;
      patch.fontSize = text.fontSize();
      patch.fontFamily = text.fontFamily();
      const style = text.fontStyle();
      patch.bold = style.includes("bold");
      patch.italic = style.includes("italic");
      patch.align = text.align() as TextAlign;
    }

    return patch;
  }

  private readDash(node: Konva.Shape): DashStyle {
    const dash = node.dash();
    if (!dash || dash.length === 0) return "solid";
    return dash[0] <= node.strokeWidth() * 2 ? "dotted" : "dashed";
  }

  private applyDash(node: Konva.Shape, style: DashStyle) {
    if (style === "solid") {
      node.dash([]);
      return;
    }
    const w = node.strokeWidth() || 2;
    node.dash(style === "dotted" ? [w, w * 2] : [w * 4, w * 2]);
  }

  private writeFontStyle(text: Konva.Text, bold: boolean, italic: boolean) {
    const parts: string[] = [];
    if (bold) parts.push("bold");
    if (italic) parts.push("italic");
    text.fontStyle(parts.join(" ") || "normal");
  }

  // 应用后刷新面板并记录历史
  private commit() {
    this.render.editToolbar.init();
    this.render.historyTool.updateHistory();
  }

  private textChildren(cb: (text: Konva.Text) => void) {
    this.eachChild((child) => {
      if (child instanceof Konva.Text) cb(child);
    });
  }

  setColor(color: string) {
    const name = this.nodes[0]?.name();
    this.eachChild((child) => {
      if (name === "shape" && child instanceof Konva.Path) {
        child.fill(color);
      } else if (
        (name === "connector" || name === "paint") &&
        child instanceof Konva.Line
      ) {
        child.stroke(color);
        if (child instanceof Konva.Arrow) child.fill(color);
      } else if (name === "text" && child instanceof Konva.Text) {
        child.fill(color);
      }
    });
    this.commit();
  }

  setStrokeColor(color: string) {
    this.eachChild((child) => {
      if (child instanceof Konva.Path) child.stroke(color);
    });
    this.commit();
  }

  setStrokeWidth(width: number) {
    this.eachChild((child) => {
      if (child instanceof Konva.Path || child instanceof Konva.Line) {
        child.strokeWidth(width);
        if (child instanceof Konva.Path && width > 0 && !child.stroke()) {
          child.stroke(DEFAULT_STROKE);
        }
        // 保持虚线比例
        const style = this.readDash(child);
        if (style !== "solid") this.applyDash(child, style);
      }
    });
    this.commit();
  }

  setDash(style: DashStyle) {
    this.eachChild((child) => {
      if (child instanceof Konva.Path || child instanceof Konva.Line) {
        this.applyDash(child, style);
      }
    });
    this.commit();
  }

  setOpacity(percent: number) {
    const value = Math.max(0, Math.min(100, percent)) / 100;
    for (const node of this.nodes) node.opacity(value);
    this.commit();
  }

  setFontSize(size: number) {
    this.textChildren((text) => text.fontSize(size));
    this.commit();
  }

  setFontFamily(family: string) {
    this.textChildren((text) => text.fontFamily(family));
    this.commit();
  }

  setBold(bold: boolean) {
    this.textChildren((text) =>
      this.writeFontStyle(text, bold, text.fontStyle().includes("italic"))
    );
    this.commit();
  }

  setItalic(italic: boolean) {
    this.textChildren((text) =>
      this.writeFontStyle(text, text.fontStyle().includes("bold"), italic)
    );
    this.commit();
  }

  setAlign(align: TextAlign) {
    this.textChildren((text) => text.align(align));
    this.commit();
  }

  // 供外部（如加载/切换选择）刷新面板
  refresh() {
    setSelectionStyle(this.getStyle());
  }
}

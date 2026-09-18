import Konva from "konva";
import type { ICanvasContext } from "../context";
import { nanoid } from "nanoid";
import { MouseButton } from "../types";
import { DEFAULT_FONT_SIZE } from "@/constants/fontSize";
export interface TextConfig {
  text?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  fill?: string;
}
export class Text {
  // 实际konva元素
  currentTextNode: Konva.Text | null = null;
  render: ICanvasContext;
  scale: number = 1;
  rotation: number = 0;
  // 初始文本宽度（不可变常量）
  initialWidth: number = 200;
  // 用于预览的textarea
  textarea: HTMLTextAreaElement | null = null;
  // 新建文本的默认样式
  private option: TextConfig = { fontSize: DEFAULT_FONT_SIZE };
  // 图形内标签的默认颜色
  private static readonly LABEL_FILL = "#1d293a";
  constructor(render: ICanvasContext) {
    this.render = render;
    this.init();
  }

  // 更新新建文本的默认样式
  configure(config: Partial<TextConfig>) {
    this.option = { ...this.option, ...config };
  }

  init(config?: TextConfig) {
    this.render.stage.on("click.createText", () => {
      if (this.render.workMode() !== "createText") return;
      const pos = this.render.stage.getRelativePointerPosition();
      if (pos) {
        this.createElement(pos, config);
      }
    });
    this.bindEvents();
  }
  createElement(pos: { x: number; y: number }, config?: TextConfig) {
    const options = { ...this.option, ...config };
    const group = new Konva.Group({
      id: nanoid(),
      name: "text",
    });
    const textNode = new Konva.Text({
      text: options.text || "添加文字",
      x: pos.x,
      y: pos.y,
      fontSize: options.fontSize ?? DEFAULT_FONT_SIZE,
      fontFamily: options.fontFamily,
      fontStyle: options.fontWeight ? String(options.fontWeight) : undefined,
      fill: options.fill,
      width: this.initialWidth,
    });
    group.add(textNode);

    this.render.layer.add(group);
    this.completeCreate();
    // 摧毁
  }
  completeCreate() {
    // this.render.stage.off("click.createText");
    this.render.historyTool.updateHistory();
    this.render.workMode("select");
  }
  destroy() {
    this.render.cursor.reset();
    // this.render.stage.off("click.createText");
    // 模式切换时提交正在编辑的文本
    if (this.textarea) {
      this.commitTextarea(true);
    }
  }

  /**
   * 双击图形：在图形中心添加文本（图形标签）
   */
  addLabelToShape(shapeGroup: Konva.Group) {
    // 已有标签则直接进入编辑
    const existing = shapeGroup.findOne(".shape-label") as Konva.Text | null;
    if (existing) {
      this.editTextNode(existing);
      return;
    }

    const label = new Konva.Text({
      name: "shape-label",
      text: "",
      align: "center",
      fontSize: this.option.fontSize ?? DEFAULT_FONT_SIZE,
      fill: Text.LABEL_FILL,
      // 标签不参与命中，选中仍作用于图形本身
      listening: false,
    });

    shapeGroup.add(label);
    this.layoutShapeLabel(shapeGroup, label);
    this.editTextNode(label);
  }

  /**
   * 让标签居中于图形，并抵消图形缩放，保证字号不随图形缩放变化
   */
  layoutShapeLabel(shapeGroup: Konva.Group, label: Konva.Text) {
    const shapeNode = shapeGroup.children.find(
      (child) => child.name() !== "shape-label"
    );
    if (!shapeNode) return;

    const box = shapeNode.getClientRect({ relativeTo: shapeGroup });
    const padding = 8;
    const width = Math.max(box.width - padding * 2, 20);
    const scaleX = shapeGroup.scaleX() || 1;
    const scaleY = shapeGroup.scaleY() || 1;

    label.setAttrs({
      // 以图形中心为锚点，配合 offset 保证旋转/缩放时居中
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
      width,
      offsetX: width / 2,
      // 抵消 group 缩放，使字号恒定
      scaleX: 1 / scaleX,
      scaleY: 1 / scaleY,
    });
    // 用文本自身高度垂直居中（不用 verticalAlign，保证与编辑框对齐）
    label.offsetY(label.height() / 2);

    // 标签不撑大图形的包围盒（否则缩小图形时 transformer 尺寸会被标签影响）
    label.getClientRect = () =>
      shapeNode.getClientRect({ relativeTo: shapeGroup });
  }

  // 图形缩放时同步标签（保持居中、字号不变）
  private syncShapeLabels(shapeGroup: Konva.Group) {
    const labels = shapeGroup.find(".shape-label") as Konva.Text[];
    labels.forEach((label) => this.layoutShapeLabel(shapeGroup, label));
  }

  createTextarea(selectingTextNode: Konva.Text) {
    const textPosition = this.getNodeTopLeft(selectingTextNode);

    const areaPosition = {
      x: this.render.stage.container().offsetLeft + textPosition.x,
      y: this.render.stage.container().offsetTop + textPosition.y,
    };
    const textarea = this.textarea || document.createElement("textarea");

    document.body.appendChild(textarea);
    textarea.value = selectingTextNode.text();
    textarea.style.position = "absolute";
    textarea.style.top = areaPosition.y + "px";
    textarea.style.left = areaPosition.x + "px";
    textarea.style.width =
      selectingTextNode.width() - selectingTextNode.padding() * 2 + "px";
    textarea.style.height =
      selectingTextNode.height() - selectingTextNode.padding() * 2 + 5 + "px";
    textarea.style.fontSize = selectingTextNode.fontSize() + "px";
    textarea.style.border = "none";
    textarea.style.padding = "0px";
    textarea.style.margin = "0px";
    textarea.style.overflow = "hidden";
    textarea.style.background = "none";
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    textarea.style.lineHeight = selectingTextNode.lineHeight() + "";
    textarea.style.fontFamily = selectingTextNode.fontFamily();
    textarea.style.transformOrigin = "left top";
    textarea.style.textAlign = selectingTextNode.align();
    textarea.style.color = selectingTextNode.fill();
    // 使用绝对旋转，使图形旋转后编辑框也跟随旋转
    const rotation = selectingTextNode.getAbsoluteRotation();
    let transform = "scale(" + this.render.stage.scaleX() + ")";
    if (rotation) {
      transform += "rotateZ(" + rotation + "deg)";
    }

    textarea.style.transform = transform;

    // reset height
    textarea.style.height = "auto";
    // after browsers resized it we can set actual value
    textarea.style.height = textarea.scrollHeight + 3 + "px";

    textarea.focus();
    return textarea;
  }

  /**
   * 打开文本编辑框（普通文本 / 图形标签通用）
   */
  editTextNode(selectingTextNode: Konva.Text) {
    // 已有编辑框先提交
    if (this.textarea) {
      this.commitTextarea(true);
    }

    this.currentTextNode = selectingTextNode;
    selectingTextNode.hide();
    this.render.transformer.hide();

    const textarea = this.createTextarea(selectingTextNode);
    this.textarea = textarea;
    // 图形标签：让编辑框与最终文本一样垂直居中
    this.centerLabelTextarea();

    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.commitTextarea(true);
      } else if (e.key === "Escape") {
        this.commitTextarea(false);
      }
    });

    // 自适应高度，并保持标签编辑框垂直居中
    textarea.addEventListener("input", () => {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + 3 + "px";
      this.centerLabelTextarea();
    });
  }

  /**
   * 关闭文本编辑框
   * @param commit 是否把 textarea 的内容写回文本节点（false 表示放弃修改）
   */
  commitTextarea(commit: boolean) {
    const textarea = this.textarea;
    const node = this.currentTextNode;
    if (!textarea || !node) return;

    textarea.parentNode?.removeChild(textarea);
    this.textarea = null;

    if (commit) {
      node.text(textarea.value);
    }

    // 文本为空则删除节点（空白标签不保留）
    if (node.text().trim() === "") {
      node.remove();
      this.render.selectionTool.selectingClear();
    } else if (node.name() === "shape-label" && node.getParent()) {
      // 内容变化后重新垂直居中
      this.layoutShapeLabel(node.getParent() as Konva.Group, node);
    }

    this.render.transformer.show();
    node.show();
    this.render.transformer.forceUpdate();
    this.render.historyTool.updateHistory();
  }

  // 图形标签编辑框：随内容高度保持垂直居中（支持旋转）
  private centerLabelTextarea() {
    const node = this.currentTextNode;
    const textarea = this.textarea;
    if (!node || !textarea || node.name() !== "shape-label") return;

    const container = this.render.stage.container();
    const scale = this.render.stage.scaleX();
    const rotation = (node.getAbsoluteRotation() * Math.PI) / 180;

    const topLeft = this.getNodeTopLeft(node);
    // 让编辑框内容中点与标签内容中点沿标签旋转后的轴向重合
    const offset = (node.height() - textarea.offsetHeight) / 2;
    const dx = -Math.sin(rotation) * scale * offset;
    const dy = Math.cos(rotation) * scale * offset;

    textarea.style.left = container.offsetLeft + topLeft.x + dx + "px";
    textarea.style.top = container.offsetTop + topLeft.y + dy + "px";
  }

  bindEvents() {
    // 双击：文本进入编辑；图形在中心添加/编辑文本标签
    this.render.stage.on("dblclick dbltap", () => {
      const mode = this.render.workMode();
      if (mode !== "default" && mode !== "select") return;

      const pos = this.render.stage.getPointerPosition();
      if (!pos) return;

      const hit = this.render.layer.getIntersection(pos);
      if (!hit) return;

      // 回溯到 layer 的顶层元素
      let target: Konva.Node | null = hit;
      while (target && target.getParent() !== this.render.layer) {
        target = target.getParent();
      }
      if (!target) return;

      // 双击文本：直接编辑
      if (target.name() === "text") {
        if (!this.render.selectionTool.selectingNodes.includes(target)) {
          this.render.selectionTool.select([target as Konva.Group]);
        }
        this.editTextNode((target as Konva.Group).children[0] as Konva.Text);
        return;
      }

      // 双击图形：添加/编辑居中标签
      if (target.name() !== "shape") return;

      // 确保双击的图形处于选中状态
      if (!this.render.selectionTool.selectingNodes.includes(target)) {
        this.render.selectionTool.select([target as Konva.Group]);
      }

      this.addLabelToShape(target as Konva.Group);
    });

    // 点击空白处提交文本编辑
    this.render.stage.on("click.outsideClick", (e) => {
      if (!this.textarea) return;
      if (e.target === this.render.stage) {
        this.commitTextarea(true);
      }
    });

    this.render.transformer.on("click.createTextrea", (e) => {
      if (e.evt.button !== MouseButton.left) return;

      if (this.render.selectionTool.selectingNodes.length !== 1) return;
      const groupTarget = this.render.selectionTool
        .selectingNodes[0] as Konva.Group;
      if (groupTarget.name() !== "text") return;

      this.editTextNode(groupTarget.children[0] as Konva.Text);
    });

    this.render.transformer.on("transform", (e) => {
      const group = e.target;
      if (!(group instanceof Konva.Group)) return;
      if (e.target.name() !== "text") return;

      const textNode = group.children[0] as Konva.Text;

      // 获取原始宽度和新宽度
      let newWidth = this.initialWidth * parseFloat("" + group.scaleX());
      // let newWidth =
      //   this.initialWidth +
      //   this.initialWidth * parseFloat(group.scaleX() - 1 + "");

      if (newWidth < 20) {
        // this.render.transformer.stopTransform();
        group.setAttrs({
          scaleX: 1 / textNode.scaleX(),
        });
        return;
      }
      if (group.scaleY() < 0.000001) {
        // this.render.transformer.stopTransform();
        group.setAttrs({
          scaleY: 1 / textNode.scaleY(),
        });
        return;
      }
      newWidth = Math.floor(newWidth);
      // 调整文本节点宽度
      textNode.setAttrs({
        width: newWidth,
        scaleX: 1 / group.scaleX(),
        scaleY: 1 / group.scaleY(),
      });
      // textNode.setAttrs({
      //   width: newWidth,
      //   scaleX: 1 ,
      //   scaleY: 1 ,
      // });

      // throw new Error("bug待修复，原因缩放倍数太小,1/xxxxx=Infinity");
      // 这样数字范围会超界限
      // todo bug待修复，选择多个节点时，若包含text节点，从右下角拖拽到右上角会报错
    });

    // 图形缩放时，保持标签居中且字号不变
    this.render.transformer.on("transform.shapeLabel", (e) => {
      const group = e.target;
      if (!(group instanceof Konva.Group)) return;
      if (group.name() !== "shape") return;
      this.syncShapeLabels(group);
    });
  }
  // 文本节点可视区域左上角（考虑 offset），用于定位编辑框
  private getNodeTopLeft(node: Konva.Text): Konva.Vector2d {
    return node.getAbsoluteTransform().point({ x: 0, y: 0 });
  }

  forceMoveTextarea(selectingTextNode: Konva.Text) {
    if (this.textarea) {
      selectingTextNode.text(this.textarea.value);
      // removeTextarea();
    }
  }
  // 舞台缩放时更新textarea
  forceUpdateTextarea() {
    if (!this.textarea) return;
    const initTransform = this.textarea.style.transform;
    // 使用正则表达式替换其中的scale
    this.textarea.style.transform = initTransform?.replace(
      /scale\((\d+\.?\d*)\)/,
      `scale(${this.render.stage.scaleX()})`
    );
    if (!this.currentTextNode) return;
    const textPosition = this.getNodeTopLeft(this.currentTextNode);

    const areaPosition = {
      x: this.render.stage.container().offsetLeft + textPosition.x,
      y: this.render.stage.container().offsetTop + textPosition.y,
    };

    this.textarea.style.top = areaPosition.y + "px";
    this.textarea.style.left = areaPosition.x + "px";
    // 图形标签：保持居中
    this.centerLabelTextarea();
  }
}

import Konva from "konva";
import { Render } from "../index";
import { nanoid } from "nanoid";
import { MouseButton } from "../types";
interface TextConfig {
  text?: string;
  fontSize?: number;
  fontWeight?: number;
}
export class Text {
  // 实际konva元素
  currentTextNode: Konva.Text | null = null;
  render: Render;
  scale: number = 1;
  rotation: number = 0;
  // 初始文本宽度（不可变常量）
  initialWidth: number = 200;
  // 用于预览的textarea
  textarea: HTMLTextAreaElement | null = null;
  constructor(render: Render) {
    this.render = render;
    this.init();
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
    const group = new Konva.Group({
      id: nanoid(),
      name: "text",
    });
    const textNode = new Konva.Text({
      text: config?.text || "添加文字",
      x: pos.x,
      y: pos.y,
      fontSize: 20,
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
    const removeTextarea = () => {
      if (!this.textarea) return;
      this.textarea.parentNode!.removeChild(this.textarea);
      this.currentTextNode?.text(this.textarea.value);
      if (this.textarea?.value.trim() === "") {
        this.currentTextNode?.remove();
        this.render.selectionTool.selectingClear();
      }
      this.textarea = null;
      this.render.transformer.show();
      this.currentTextNode!.show();
      this.render.transformer.forceUpdate();
    };
    removeTextarea();
  }
  createTextarea(selectingTextNode: Konva.Text) {
    const textPosition = selectingTextNode.absolutePosition();

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
    const rotation = selectingTextNode.rotation();
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
  bindEvents() {
    this.render.transformer.on("click.createTextrea", (e) => {
      if (e.evt.button !== MouseButton.left) return;

      if (this.render.selectionTool.selectingNodes.length !== 1) return;
      const groupTarget = this.render.selectionTool
        .selectingNodes[0] as Konva.Group;
      if (groupTarget.name() !== "text") return;
      const selectingTextNode = groupTarget.children[0] as Konva.Text;
      this.currentTextNode = selectingTextNode;

      selectingTextNode.hide();
      this.render.transformer.hide();

      this.textarea = this.createTextarea(selectingTextNode);

      const removeTextarea = () => {
        if (!this.textarea) return;
        this.textarea.parentNode!.removeChild(this.textarea);
        if (this.textarea?.value.trim() === "") {
          this.currentTextNode?.remove();
          this.render.selectionTool.selectingClear();
        }
        this.textarea = null;
        this.render.transformer.show();
        this.currentTextNode?.show();
        this.render.transformer.forceUpdate();
      };
      this.textarea.addEventListener("keydown", (e) => {
        if (!selectingTextNode || !this.textarea) return;
        if (e.key === "Enter" && !e.shiftKey) {
          selectingTextNode?.text(this.textarea.value);
          removeTextarea();
        }
        if (e.key === "Escape") {
          removeTextarea();
        }
      });

      this.textarea.addEventListener("keydown", () => {
        if (!selectingTextNode || !this.textarea) return;
        this.textarea.style.height = "auto";
        this.textarea.style.height =
          this.textarea.scrollHeight + selectingTextNode?.fontSize() + "px";
      });

      this.render.stage.on("click.outsideClick", (e) => {
        if (!selectingTextNode || !this.textarea) return;
        if (e.target === this.render.stage) {
          this.currentTextNode?.text(this.textarea.value);

          removeTextarea();
        }
        // this.render.stage.off("click.outsideClick")
      });
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
          scaleX: 1/textNode.scaleX(),
        });
        return;
      }
      if (group.scaleY() < 0.000001) {
        // this.render.transformer.stopTransform();
        group.setAttrs({
          scaleY: 1/textNode.scaleY(),
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
    const textPosition = this.currentTextNode.absolutePosition();

    const areaPosition = {
      x: this.render.stage.container().offsetLeft + textPosition.x,
      y: this.render.stage.container().offsetTop + textPosition.y,
    };

    this.textarea.style.top = areaPosition.y + "px";
    this.textarea.style.left = areaPosition.x + "px";
  }
}

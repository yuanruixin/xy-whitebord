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
      const pos = this.render.stage.getPointerPosition();
      if (pos) {
        this.creatElement(pos, config);
      }
    });
    this.bindEvents();
  }
  creatElement(pos: { x: number; y: number }, config?: TextConfig) {
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
    this.render.workMode("select");
  }
  destory() {
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

      const textPosition = selectingTextNode.absolutePosition();

      const areaPosition = {
        x: this.render.stage.container().offsetLeft + textPosition.x,
        y: this.render.stage.container().offsetTop + textPosition.y,
      };

      function createTextarea(this: Text) {
        const textarea = this.textarea || document.createElement("textarea");

        document.body.appendChild(textarea);
        textarea.value = selectingTextNode.text();
        textarea.style.position = "absolute";
        textarea.style.top = areaPosition.y + "px";
        textarea.style.left = areaPosition.x + "px";
        textarea.style.width =
          selectingTextNode.width() - selectingTextNode.padding() * 2 + "px";
        textarea.style.height =
          selectingTextNode.height() -
          selectingTextNode.padding() * 2 +
          5 +
          "px";
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
        let transform = "";
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
      this.textarea = createTextarea.apply(this);

      const setTextareaWidth = (newWidth: number) => {
        if (!this.textarea) return;
        this.textarea.style.width = newWidth + "px";
      };
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
        // this.render.transformer.forceUpdate();
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
        this.scale = selectingTextNode.getAbsoluteScale().x;
        setTextareaWidth(selectingTextNode.width() * this.scale);
        this.textarea.style.height = "auto";
        this.textarea.style.height =
          this.textarea.scrollHeight + selectingTextNode?.fontSize() + "px";
      });

      this.render.stage.on("click.outsideClick", (e) => {
        if (!selectingTextNode || !this.textarea) return;
        if (e.target === this.render.stage) {
          // todo 这里有问题，selectingTextNode不是当前选择的节点，而是上次选择的节点
          console.log(
            this.textarea,
            "移除textarea前",
            this.currentTextNode?.text()
          );
          this.currentTextNode?.text(this.textarea.value);

          removeTextarea();
          console.log(
            this.textarea,
            "移除textarea后",
            this.currentTextNode?.text()
          );
        }
        // this.render.stage.off("click.outsideClick")
      });
    });

    this.render.transformer.on("transform", (e) => {
      const group = e.target;
      if (!(group instanceof Konva.Group)) return;

      const textNode = group.children[0] as Konva.Text;

      // 获取原始宽度和新宽度
      let newWidth = this.initialWidth * parseFloat("" + group.scaleX());
      newWidth = Math.ceil(newWidth)

      // 调整文本节点宽度
      textNode.width(newWidth);
    });
  }
  forcerMoveTextarea(selectingTextNode: Konva.Text) {
    if (this.textarea) {
      selectingTextNode.text(this.textarea.value);
      // removeTextarea();
    }
  }
}

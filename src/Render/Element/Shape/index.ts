import Konva from "konva";
import type { ICanvasContext } from "@/Render/context";
import { SHAPE_PATHS, createShapeElement, type ShapeType } from "@/scene";
import { throttle } from "@/utils/throttle";
import { loadImage } from "@/Render/utils/loadImage";
export type { ShapeType } from "@/scene";
interface ShapeConfig {
  shape: ShapeType;
  fill?: string;
}
export class Shape {
  render: ICanvasContext;
  config: ShapeConfig | null = null;
  private _moveTimesAfterCreate = 0;
  // 预览元素
  private previewingElement: HTMLDivElement | null = null;
  initialSize: {
    width: number;
    height: number;
  } | null = null;
  constructor(render: ICanvasContext) {
    this.render = render;
  }

  //  正在创建元素
  async init(config: ShapeConfig) {
    this.render.workMode("createElement");
    this.config = config;

    //  初始化预览元素
    if (this.previewingElement?.parentElement) {
      this.previewingElement.parentNode?.removeChild(this.previewingElement);
    }

    this.previewingElement = await this.createPreviewElement();

    // 移动时更新元素
    this.render.container.addEventListener(
      "mousemove",
      this.creatingMousemoveHandler
    );

    // 再次点击stage容器，创建元素
    this.render.container.addEventListener("click", this.completeCreate);
  }
  // 完成创建显示真实图形
  completeCreate = () => {
    if (!this.config) throw "请先执行init进行初始化，然后进行绘制";
    const pos = this.render.stage.getRelativePointerPosition();
    if (!pos) return;

    // 以路径的自然尺寸建立模型元素，保持插入时的原始大小
    const natural = new Konva.Path({ data: SHAPE_PATHS[this.config.shape] });
    const box = natural.getClientRect();
    const element = createShapeElement({
      shape: this.config.shape,
      fill: this.config.fill,
      x: pos.x,
      y: pos.y,
      width: box.width,
      height: box.height,
    });

    this.render.createElement(element);

    // 恢复鼠标模式
    this.render.workMode("default");
    this.hidePreviewElement();
    this.destroy();
  };
  creatingMousemoveHandler = throttle(
    (e: GlobalEventHandlersEventMap["mousemove"]) => {
      // 用于确定是否是第一次移动
      if (this._moveTimesAfterCreate < 3) this._moveTimesAfterCreate++;
      // 鼠标不在stage中，不显示
      const previewingElement = this.previewingElement;
      if (!previewingElement) return;

      const x = e.clientX;
      const y = e.clientY;

      previewingElement.style.transform = `
            translate(${x}px,${y}px)
       `;

      if (this._moveTimesAfterCreate === 1) {
        //  下次重绘时执行(保证上一行css操作完成后再执行下一步)，否则浏览器会把css多步操作进行合并操作
        requestAnimationFrame(() => {
          if (this.previewingElement) {
            this.showPreviewElement();
            requestAnimationFrame(() => {
              this.previewingElement!.style.transition = "all 0.2s ease";
            });
          }
        });
      }
    },
    30
  );

  // 创建节点 用于预览大小 和 位置
  private async createPreviewElement() {
    const previewElementNode = document.createElement("div");
    document.body.appendChild(previewElementNode);
    // 鼠标穿透
    previewElementNode.style.pointerEvents = "none";
    previewElementNode.style.position = "fixed";
    // 图片节点
    const imgNode = await loadImage(this.getSelectedImageURL());
    imgNode.style.pointerEvents = "none";
    imgNode.draggable = false;

    previewElementNode.appendChild(imgNode);

    this.initialSize = {
      width: previewElementNode.offsetWidth * this.render.stage.scaleX(),
      height: previewElementNode.offsetHeight * this.render.stage.scaleX(),
    };

    Object.assign(previewElementNode.style, {
      left: 0,
      top: 0,
      draggable: false,
    });
    // 这里需要手动赋值
    previewElementNode.style.width = this.initialSize.width + "px";
    previewElementNode.style.height = this.initialSize.height + "px";
    // 默认创建到当前鼠标位置

    const mousePos = this.render.stage.getPointerPosition() || { x: 0, y: 0 };

    previewElementNode.style.transform = `translate(${mousePos.x}px,${mousePos.y + 60}px)`;

    return previewElementNode;
  }
  /**
   * @description 动态引入图片文件
   */
  getSelectedImageURL() {
    return new URL(
      `../../../assets/shapes/${this.config?.shape}.svg`,
      import.meta.url
    ).href;
  }

  showPreviewElement() {
    if (!this.previewingElement) return;
    this.previewingElement.style.opacity = "1";
  }
  hidePreviewElement() {
    if (!this.previewingElement) return;
    this.previewingElement.style.opacity = "0";
  }
  // 用于手动更新 预览元素
  updatePreviewElementSize() {
    if (!this.previewingElement || !this.initialSize) return;
    this.previewingElement.style.width =
      this.initialSize.width * this.render.stage.scaleX() + "px";
    this.previewingElement.style.height =
      this.initialSize.height * this.render.stage.scaleX() + "px";
  }

  destroy = () => {
    this.render.container.removeEventListener(
      "mousemove",
      this.creatingMousemoveHandler
    );
    this.render.container.removeEventListener("click", this.completeCreate);
    this._moveTimesAfterCreate = 0;

    if (this.previewingElement) {
      this.previewingElement.style.transition = "";
      this.previewingElement.parentNode?.removeChild(this.previewingElement!);
    }
  };
}

import Konva from "konva";
import { nanoid } from "nanoid";
import { Render } from "@/Render";
import pathJSon from "./pathData.json";
import { throttle } from "@/utils/throttle";
import { loadImage } from "@/Render/utils/image";
export type ShapeType =
  | "arrowLeft"
  | "arrowRight"
  | "diamond"
  | "ellipse"
  | "endFile"
  | "engDatabase"
  | "engQueue"
  | "parallelogramLeft"
  | "parallelogramRight"
  | "rectangle"
  | "triangleDown"
  | "triangleUp";
// 创建元素使用path，方便修改颜色
const pathData: {
  [k in ShapeType]: string;
} = pathJSon;
interface ShapeConfig {
  shape: ShapeType;
  fill?: string;
}
export class Shape {
  render: Render;
  config: ShapeConfig | null = null;
  private _moveTimesAfterCreat = 0;
  // 预览元素
  private previewingElement: HTMLDivElement | null = null;
  // 实际konva元素
  shapeElement: Konva.Path | null = null;
  initialSize: {
    width: number;
    height: number;
  } | null = null;
  constructor(render: Render) {
    this.render = render;
  }
  // 完成创建显示真实图形
  completeCreate() {
    if (!this.config) throw "请先执行init进行初始化，然后进行绘制";
    const group = new Konva.Group({
      id: nanoid(),
      name: "shape",
    });

    let fill = this.config.fill ?? "#4e95ff";

    this.shapeElement = new Konva.Path({
      x: 0,
      y: 0,
      data: pathData[this.config.shape],
      fill,
    });

    const pos = this.render.getPointerPosAfterStageChanged()
    if (!pos || !this.shapeElement) return;
    this.shapeElement.setAttrs({
      x: pos.x,
      y: pos.y,
    });
    group.add(this.shapeElement);

    // hover 框（多选时才显示）
    group.add(
      new Konva.Rect({
        id: "hoverRect",
        width: this.initialSize!.width,
        height: this.initialSize!.height,
        fill: "rgba(0,255,0,0.3)",
        visible: false,
      })
    );
    this.render.layer.add(group);

    // 恢复鼠标模式
    this.render.workMode("default");
    this.hidePreviewElement();
    this.destory();
  }

  //  正在创建元素
  async creating(config: ShapeConfig) {
    this.config = config;

    //  待优化（暂时销毁再重建。期待——>存在则复用）
    if (this.previewingElement) {
      this.previewingElement.parentNode!.removeChild(this.previewingElement);
    }
    this.previewingElement = await this.createPreviewElement();

    // 疑问？？？监听stage，有卡顿。监听window则没有
    /*     this.render.stage.on(
      "mousemove.creatingShape",
      throttle((e: Konva.KonvaEventObject<MouseEvent>) => {
        console.log("creating");

        // 鼠标不在stage中，不显示
        const previewingElement = this.previewingElement;
        if (!previewingElement) return;

        const x = e.evt.clientX;
        const y = e.evt.clientY;
        // 下面代码让回调卡顿
        requestAnimationFrame(() => {
          previewingElement.style.transform = `
        translate(${x}px,${y}px)
      `;
        });
      }, 30)
    ); */

    // 原生监听事件（解决卡顿问题）
    this.render.container.addEventListener(
      "mousemove",
      this.creatingMousemoveHandler
    );
  }

  creatingMousemoveHandler = throttle(
    (e: GlobalEventHandlersEventMap["mousemove"]) => {
      // 用于确定是否是第一次移动
      if (this._moveTimesAfterCreat < 3) this._moveTimesAfterCreat++;
      // 鼠标不在stage中，不显示
      const previewingElement = this.previewingElement;
      if (!previewingElement) return;

      const x = e.clientX;
      const y = e.clientY;
      // 下面代码让回调卡顿
      previewingElement.style.transform = `
            translate(${x}px,${y}px)
       `;

      if (this._moveTimesAfterCreat === 1) {
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
    let previewElementNode = document.createElement("div");

    Object.assign(previewElementNode.style, {
      left: 0,
      top: 0,
      draggable: false,
    });

    document.body.appendChild(previewElementNode);
    previewElementNode.style.position = "fixed";
    // previewElementNode.innerHTML = `<img id='imgOfPreviewElement' draggable='false' class='block' src='${this.getSelectedImagetURl()}'/>`;
    const imgNode = await loadImage(this.getSelectedImagetURl());
    imgNode.draggable = false;
    previewElementNode.appendChild(imgNode);
    this.initialSize = {
      width: previewElementNode.offsetWidth * this.render.stage.scaleX(),
      height: previewElementNode.offsetHeight * this.render.stage.scaleX(),
    };
    return previewElementNode;
  }
  /**
   * @description 动态引入图片文件
   */
  getSelectedImagetURl() {
    // （注意:1.只能使用模板字符串 2.不能使用路径别名，要使用相对路径）
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

  destory = () => {
    this.render.container.removeEventListener(
      "mousemove",
      this.creatingMousemoveHandler
    );

    this._moveTimesAfterCreat = 0;

    if (this.previewingElement) {
      this.previewingElement.style.transition = "";
    }
  };
}

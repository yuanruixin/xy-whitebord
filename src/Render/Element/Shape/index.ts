import Konva from "konva";
import { nanoid } from "nanoid";
import { Render } from "@/Render";
import pathJSon from "./pathData.json";
import { throttle } from "@/utils/throttle";
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
  private previewingElement: HTMLDivElement | null = null;
  config: ShapeConfig | null = null;
  constructor(render: Render) {
    this.render = render;
  }
  private _moveTimesAfterCreat = 0;

  // 完成创建显示真实图形
  completeCreate() {
    if (!this.config) throw "请先执行init进行初始化，然后进行绘制";

    let fill = this.config.fill ?? "#4e95ff";

    const group = new Konva.Group({
      id: nanoid(),
      name: "shape",
    });

    const pos = this.render.stage.getPointerPosition();

    const element = new Konva.Path({
      x: pos?.x,
      y: pos?.y,
      data: pathData[this.config.shape],
      fill,
    });

    group.add(element);

    // hover 框（多选时才显示）
    group.add(
      new Konva.Rect({
        id: "hoverRect",
        width: element.width(),
        height: element.height(),
        fill: "rgba(0,255,0,0.3)",
        visible: false,
      })
    );
    this.render.layer.add(group);

    // 恢复鼠标模式
    this.render.mouseMode("default");
    this.hideShadowElement();
    this.destory();
  }

  //  正在创建元素
  creating(config: ShapeConfig) {
    this.config = config;

    // 有则复用，无则创建
    if (!this.previewingElement)
      this.previewingElement = this.createPreviewElement();
    const img: HTMLImageElement = document.querySelector(
      "#imgOfPreviewElement"
    )!;

    img.src = this.getSelectedImagetURl();

    // 疑问？？？监听stage，有卡顿。监听window则没有
    //    this.render.stage.on(
    //   "mousemove.creatingShape",
    //   throttle((e: Konva.KonvaEventObject<MouseEvent>) => {
    //     console.log("creating");

    //     // 鼠标不在stage中，不显示
    //     const previewingElement = this.previewingElement;
    //     if (!previewingElement) return;

    //     const x = e.evt.clientX;
    //     const y = e.evt.clientY;
    //     // 下面代码让回调卡顿
    //     requestAnimationFrame(() => {
    //       previewingElement.style.transform = `
    //     translate(${x}px,${y}px)
    //   `;
    //     });
    //   }, 30)
    // );

    // 原生监听事件（解决卡顿问题）
    this.render.container.addEventListener(
      "mousemove",
      this.creatingMousemoveHandler
    );
  }

  creatingMousemoveHandler = throttle(
    (e: GlobalEventHandlersEventMap["mousemove"]) => {
      this._moveTimesAfterCreat++;
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
            this.showShadowElement();
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
  private createPreviewElement() {
    let shadowElementNode = document.createElement("div");
    Object.assign(shadowElementNode.style, {
      left: 0,
      top: 0,
      draggable: false,
    });
    document.body.appendChild(shadowElementNode);
    shadowElementNode.style.position = "fixed";
    shadowElementNode.innerHTML = `<img id='imgOfPreviewElement' draggable='false' src='${this.getSelectedImagetURl()}'/>`;

    return shadowElementNode;
  }
  // 动态引入图片文件（注意:1.只能使用动态字符串 2.不能使用路径别名，要使用相对路径）
  getSelectedImagetURl() {
    return new URL(
      `../../../assets/shapes/${this.config?.shape}.svg`,
      import.meta.url
    ).href;
  }

  showShadowElement() {
    if (!this.previewingElement) return;
    this.previewingElement.style.opacity = "1";
  }
  hideShadowElement() {
    if (!this.previewingElement) return;
    this.previewingElement.style.opacity = "0";
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

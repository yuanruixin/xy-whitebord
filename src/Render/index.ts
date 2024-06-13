import Konva from "konva";
import * as Types from "./types";
import { Cursor } from "./Cursor";
import * as Tools from "./tools";
import * as Draws from "./draws";
import * as Handlers from "./handlers";
import * as elements from "./Element";
import { getKeys } from "@/utils/secureTS";
// 主类
export class Render {
  container: HTMLDivElement;
  // 同一时间鼠标只能处理一个事件(创建元素、画笔、橡皮、选择模式、拖拽模式)
  private _workMode: Types.MouseMode = "default";

  stage: Konva.Stage;
  // 主要层
  layer: Konva.Layer = new Konva.Layer({ id: "main" });
  // 辅助层 - 底层
  layerFloor: Konva.Layer = new Konva.Layer();
  // 辅助层 - 顶层
  layerCover: Konva.Layer = new Konva.Layer();
  // 配置
  config: Types.RenderConfig;

  // 附加工具
  draws: {
    bg: Draws.BgDraw;
  };
  // 素材工具
  // assetTool: Tools.AssetTool
  // 形状创建工具
  shape: elements.Shape;
  // 绘制工具(画笔、橡皮)
  paintTool: Tools.PaintTool;
  // 选择工具
  selectionTool: Tools.SelectionTool;

  // 多选器层
  groupTransformer: Konva.Group = new Konva.Group();

  // 多选器
  transformer: Konva.Transformer = new Konva.Transformer({
    shouldOverdrawWholeArea: true,
    borderDash: [4, 4],
    padding: 1,
    rotationSnaps: [0, 45, 90, 135, 180, 225, 270, 315, 360],
  });

  // 选择框
  selectRect: Konva.Rect = new Konva.Rect({
    id: "selectRect",
    fill: "rgba(0,0,0,0.1)",
    visible: true,
  });
  // 光标管理
  cursor: Cursor;
  // 参数
  bgSize = 20;
  // 事件处理
  handlersManager: {
    [Handlers.DragHandlers.name]: Handlers.DragHandlers;
    [Handlers.ZoomHandlers.name]: Handlers.ZoomHandlers;
    [Handlers.SelectionHandlers.name]: Handlers.SelectionHandlers;
  };

  // 监听函数回调管理

  constructor(container: HTMLDivElement, config: Types.RenderConfig) {
    this.config = config;
    this.container = container;
    this.stage = new Konva.Stage({
      container: container,
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    });
    // 鼠标样式设置
    this.cursor = new Cursor(this);

    // 附加工具
    this.draws = {
      bg: new Draws.BgDraw(this, this.layerFloor, {
        size: this.bgSize,
      }),
    };
    // 辅助层-顶层
    this.groupTransformer.add(this.transformer);
    this.groupTransformer.add(this.selectRect);
    this.layerCover.add(this.groupTransformer);
    // 选择工具
    this.selectionTool = new Tools.SelectionTool(this);
    // 画笔工具
    this.paintTool = new Tools.PaintTool(this);
    // 形状创建
    this.shape = new elements.Shape(this);

    // 事件处理初始化
    this.handlersManager = {
      [Handlers.ZoomHandlers.name]: new Handlers.ZoomHandlers(this),
      [Handlers.DragHandlers.name]: new Handlers.DragHandlers(this),
      [Handlers.SelectionHandlers.name]: new Handlers.SelectionHandlers(this),
    };

    this.init();
  }
  init() {
    this.stage.add(this.layerFloor);
    this.draws[Draws.BgDraw.name].init();

    this.stage.add(this.layer);

    this.stage.add(this.layerCover);

    // 事件绑定
    this.eventBind();
  }

  /**
   * @description 这里设置获取获取当前工作模式
   */
  workMode(workMode?: Types.MouseMode) {
    if (!workMode) return this._workMode;

    if (workMode === this._workMode) return workMode;
    // 清除旧工具
    const oldMouseMode = this._workMode;
    if (oldMouseMode === "createElement") {
      this.shape.destory();
    } else if (oldMouseMode === "brush") {
      this.paintTool.destroy();
    }

    // 设置新工具
    this._workMode = workMode;
    if (workMode === "drag") {
      this.stage.draggable(true);
      this.cursor.set("grab");
    } else if (workMode === "brush") this.cursor.set("brush");
    else if (workMode === "earser") this.cursor.set("eraser");
    else this.cursor.reset();

    return this._workMode;
  }
  // 事件绑定
  eventBind() {
    // 获取哪个handler工具（即handers下的不同功能封装）
    getKeys(this.handlersManager).forEach((handlerToolName) => {
      // 获取要监听的对象 target
      getKeys(this.handlersManager[handlerToolName].handlers).forEach(
        (target) => {
          // 这里不能正确推断类型(需要手动纠正)
          const targetAfteCorrectedType = target as
            | "dom"
            | "stage"
            | "transformer";
          // 获取监听事件名 event
          getKeys(
            this.handlersManager[handlerToolName].handlers[target]
          ).forEach((event) => {
            const callback =
              this.handlersManager[handlerToolName].handlers[target][event];
            if (targetAfteCorrectedType === "dom") {
              this.container.addEventListener(event, callback);
            } else if (
              targetAfteCorrectedType === "stage" ||
              targetAfteCorrectedType === "transformer"
            ) {
              // 增加事件修饰符
              const eventName = event + "." + handlerToolName;
              this[target].on(eventName, callback);
            } else {
              // 未处理的分支
              const a: never = targetAfteCorrectedType;
              throw `未处理的分支,${a}`;
            }
          });
        }
      );
    });

    const container = this.stage.container();
    container.tabIndex = 1;
    // for (const event of [
    //   "mouseenter",
    //   "dragenter",
    //   "mouseout",
    //   "dragenter",
    //   "dragover",
    //   "drop",
    //   "keydown",
    //   "keyup",
    // ]) {
    //   container.addEventListener(event, (e) => {
    //     e?.preventDefault();

    //     // if (["mouseenter", "dragenter"].includes(event)) {
    //     //   // 激活 dom 事件
    //     //   this.stage.container().focus();
    //     // }

    //     for (const k in this.draws) {
    //       this.draws[k as keyof typeof this.draws].handlers?.dom?.[event]?.(e);
    //     }

    //     for (const k in this.handlers) {
    //       this.handlers[k].handlers?.dom?.[event]?.(e);
    //     }
    //   });
    // }

    // for (const event of [
    //   "mousedown",
    //   "transformend",
    //   "dragstart",
    //   "dragmove",
    //   "dragend",
    // ]) {
    //   this.transformer.on(event, (e) => {
    //     e?.evt?.preventDefault();

    //     for (const k in this.draws) {
    //       this.draws[k].handlers?.transformer?.[event]?.(e);
    //     }

    //     for (const k in this.handlers) {
    //       this.handlers[k].handlers?.transformer?.[event]?.(e);
    //     }
    //   });
    // }

    // this.handlers[Handlers.SelectionHandlers.name].transformerConfig
    //   ?.dragBoundFunc &&
    //   this.transformer.dragBoundFunc(
    //     this.handlers[Handlers.SelectionHandlers.name].transformerConfig!
    //       .dragBoundFunc!
    //   );
  }

  // 获取 stage 状态
  getStageState() {
    return {
      width: this.stage.width(),
      height: this.stage.height(),
      scale: this.stage.scaleX(),
      x: this.stage.x(),
      y: this.stage.y(),
    };
  }
  // 相对大小（基于 stage，且无视 scale）
  toStageValue(boardPos: number) {
    return boardPos / this.stage.scaleX();
  }

  // 绝对大小（基于可视区域像素）
  toBoardValue(stagePos: number) {
    return stagePos * this.stage.scaleX();
  }
  // setDraggable(draggable: boolean) {
  //   this.stage.draggable(draggable);
  //   if (draggable) this.cursor.set("grab");
  //   else this.cursor.set("default");
  // }

  // 忽略非素材
  ignore(node: Konva.Node) {
    // 素材有各自根 group
    const isGroup = node instanceof Konva.Group;
    return (
      !isGroup ||
      node.id() === "selectRect" ||
      node.id() === "hoverRect" ||
      this.ignoreDraw(node)
    );
  }

  // 忽略各 draw 的根 group
  ignoreDraw(node: Konva.Node) {
    return node.name() === Draws.BgDraw.name;
  }

  setStageScale(scale: number) {
    const newScale = +scale.toFixed(2);
    this.stage.scale({ x: newScale, y: newScale });

    // 更新背景
    this.draws.bg.draw();

    // 更新预览元素默认大小
    this.shape.updatePreviewElementSize();
  }

  /**
   * @description 获取鼠标位置（在stage的scale和x,y属性变化后的相对鼠标位置）
   *
   */
  getPointerPosAfterStageChanged() {
    const getPointerPosInStage = this.stage.getPointerPosition();
    if (!getPointerPosInStage) return null;
    const stageState = this.getStageState();
    return {
      x: this.toStageValue(getPointerPosInStage.x - stageState.x),
      y: this.toStageValue(getPointerPosInStage.y - stageState.y),
    };
  }

  deleteSelectingElement() {
    const remove = (nodes: Konva.Node[]) => {
      for (const node of nodes) {
        if (node instanceof Konva.Transformer) {
          // 移除已选择的节点
          remove(this.selectionTool.selectingNodes);
        } else {
          // 移除未选择的节点
          node.remove();
        }
      }

      if (nodes.length > 0) {
        // 更新历史
        // this.updateHistory()
        // // 更新预览
        // this.draws[Draws.PreviewDraw.name].draw()
      }
    };
    remove(this.selectionTool.selectingNodes);
    this.selectionTool.selectingClear();
  }
}

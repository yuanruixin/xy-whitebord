import Konva from "konva";
import * as Types from "./types";
import type { ICanvasContext } from "./context";
import { ModeManager } from "./ModeManager";
import { EventManager } from "./EventManager";
import { Cursor } from "./Cursor";
import * as Tools from "./tools";
import * as Draws from "./draws";
import * as Handlers from "./handlers";
import * as elements from "./Element";
import { getKeys } from "@/utils/secureTS";
import { ActionManager } from "@/actions/ActionManager";
import { elementToKonva } from "./scene/konva";
import type { BoardElement } from "@/scene";
// 主类
export class Render implements ICanvasContext {
  container: HTMLDivElement;
  // 同一时间鼠标只能处理一个事件(创建元素、画笔、橡皮、选择模式、拖拽模式)
  private modeManager: ModeManager = new ModeManager(this);

  stage: Konva.Stage;
  // 事件管理器（统一命名空间绑定/解绑）
  events: EventManager;
  // 主要层
  layer: Konva.Layer = new Konva.Layer({ id: "main" });
  // 辅助层 - 底层
  layerFloor: Konva.Layer = new Konva.Layer();
  // 辅助层 - 顶层
  layerCover: Konva.Layer = new Konva.Layer();
  // 配置
  config: Types.RenderConfig;
  // 一次性工具（如连接线）绘制完成后回调，用于同步外部 UI 状态
  onToolFinish: (() => void) | null = null;

  // 附加工具
  draws: {
    bg: Draws.BgDraw;
    contextmenu: Draws.ContextmenuDraw;
  };
  // 形状创建工具
  shape: elements.Shape;
  text: elements.Text;
  image: elements.Image;
  cursor: Cursor; // 光标样式设置

  paintTool: Tools.PaintTool = new Tools.PaintTool(this); // 绘制工具(画笔、橡皮)
  eraserTool: Tools.EraserTool = new Tools.EraserTool(this); // 橡皮擦工具(对象擦除)
  connectorTool: Tools.ConnectorTool = new Tools.ConnectorTool(this); // 连接线工具
  styleTool: Tools.StyleTool = new Tools.StyleTool(this); // 选中元素样式工具
  selectionTool: Tools.SelectionTool = new Tools.SelectionTool(this); // 选择工具
  editToolbar: Tools.EditToolbar = new Tools.EditToolbar(this); // 编辑条工具
  zIndexTool: Tools.ZIndexTool = new Tools.ZIndexTool(this); // 层级工具
  importExportTool: Tools.ImportExportTool = new Tools.ImportExportTool(this); // 导入导出工具
  historyTool: Tools.HistoryTool = new Tools.HistoryTool(this); // 历史工具
  // 复制工具
  copyTool: Tools.CopyTool = new Tools.CopyTool(this);
  // 画布操作工具（供 AI 等外部能力调用：创建/移动/删除/连线）
  canvasTool: Tools.CanvasCommandTool = new Tools.CanvasCommandTool(this);
  // 成组 / 解组
  groupTool: Tools.GroupTool = new Tools.GroupTool(this);
  // 动作注册表（快捷键 / 右键菜单共用）
  actions: ActionManager = new ActionManager(this);
  // 多选器层
  groupTransformer: Konva.Group = new Konva.Group();

  // 多选器
  transformer: Konva.Transformer = new Konva.Transformer({
    flipEnabled: false,
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

  // 参数
  bgSize = 20;
  // 事件处理
  // 事件处理初始化
  handlersManager = {
    [Handlers.ZoomHandlers.name]: new Handlers.ZoomHandlers(this),
    [Handlers.DragHandlers.name]: new Handlers.DragHandlers(this),
    [Handlers.SelectionHandlers.name]: new Handlers.SelectionHandlers(this),
    [Handlers.ShortcutHandlers.name]: new Handlers.ShortcutHandlers(this),
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
    this.events = new EventManager(this.container, this.stage, this.transformer);

    // 附加工具
    this.draws = {
      bg: new Draws.BgDraw(this, this.layerFloor, {
        size: this.bgSize,
      }),
      contextmenu: new Draws.ContextmenuDraw(this, this.layerCover, {}),
    };
    this.shape = new elements.Shape(this);
    this.text = new elements.Text(this);
    this.image = new elements.Image(this);
    this.cursor = new Cursor(this); // 光标样式设置
    // 辅助层-顶层
    this.groupTransformer.add(this.transformer);
    this.groupTransformer.add(this.selectRect);
    this.layerCover.add(this.groupTransformer);

    this.init();
    this.loadInitialScene();

    // 页面隐藏/关闭前立即保存，避免防抖未触发导致丢数据
    window.addEventListener("pagehide", () => {
      this.importExportTool.saveToLocalStorage();
    });
  }
  /**
   * @description 初始化画面：优先恢复本地缓存，否则新建空历史记录
   */
  async loadInitialScene() {
    const cached = this.importExportTool.loadFromLocalStorage();
    if (cached) {
      await this.importExportTool.restore(cached, true);
      this.historyTool.reset();
    } else {
      this.historyTool.updateHistory();
    }
  }
  init() {
    this.stage.add(this.layerFloor);
    this.draws[Draws.BgDraw.name].init();
    this.draws[Draws.ContextmenuDraw.name].init();
    this.stage.add(this.layer);

    this.stage.add(this.layerCover);

    // 连接线在图形变换时跟随（需先于 SelectionHandlers 注册，确保拖动结束先归一化再记录历史）
    this.connectorTool.initEvents();

    // 事件绑定
    this.eventBind();
  }
  /**
   * @description 这里设置获取获取当前工作模式(特殊工具初始化时，需要传递参数)
   */
  workMode<T extends Types.MouseMode>(
    workMode?: T,
    config?: T extends "brush" ? Tools.PaintTool.InitPaintConfig : undefined
  ): Types.MouseMode {
    return this.modeManager.switch(workMode, config);
  }
  eventBind() {
    // handlers事件绑定
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
            this.events.on(
              handlerToolName,
              targetAfteCorrectedType,
              event as string,
              callback
            );
          });
        }
      );
    });

    const container = this.stage.container();
    container.tabIndex = 1;

    getKeys(this.draws.contextmenu.handlers).forEach((bindTarget) => {
      if (bindTarget === "stage") {
        getKeys(this.draws.contextmenu.handlers[bindTarget]).forEach(
          (eventName) => {
            const callBack =
              this.draws.contextmenu.handlers[bindTarget][eventName];
            this.stage.on(eventName, callBack);
          }
        );
      }
    });

    // draws事件绑定
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

  /**
   * 模型 -> 节点 的统一创建入口：挂载节点，按需选中并记录历史。
   * 运行时的形状 / 文本 / 连接线创建均通过此方法，保证行为一致。
   */
  createElement(
    element: BoardElement,
    options: { select?: boolean; record?: boolean } = {}
  ): Konva.Group {
    const node = elementToKonva(element);
    this.layer.add(node);

    if (options.select) {
      this.selectionTool.select([node]);
    }
    if (options.record !== false) {
      this.historyTool.updateHistory();
    }
    return node;
  }

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
    return (
      node.name() === Draws.BgDraw.name ||
      node.name() === Draws.ContextmenuDraw.name
    );
  }

  setStageScale(scale: number) {
    const newScale = +scale.toFixed(2);
    this.stage.scale({ x: newScale, y: newScale });

    // 更新背景
    this.draws.bg.draw();

    // 更新预览元素默认大小
    this.shape.updatePreviewElementSize();

    // 更新工具条位置
    this.editToolbar.init();
    // 更新文本框位置
    this.text.forceUpdateTextarea();
  }

  /**
   * @description 获取鼠标位置（在stage的scale和x,y属性变化后的相对鼠标位置）
   *
   */
  getPointerPosAfterStageChanged() {
    const getPointerPosInStage = this.stage.getPointerPosition();
    if (!getPointerPosInStage) return null;
    return this.stage.getAbsoluteTransform().point({
      x: getPointerPosInStage.x,
      y: getPointerPosInStage.y + 60,
    });
  }

  deleteSelectingElement() {
    this.editToolbar.close();

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
        this.historyTool.updateHistory();
      }
    };
    remove(this.selectionTool.selectingNodes);
    this.selectionTool.selectingClear();
    // 刷新连接线（绑定图形被删除后保留在最后位置）
    this.connectorTool.refreshAll();
  }

  /**
   * 方向键微调选中元素
   * @param record 是否立即记录历史（连续按键时可延迟合并）
   */
  moveSelectedBy(dx: number, dy: number, record = true) {
    const nodes = this.selectionTool.selectingNodes;
    if (nodes.length === 0) return;

    for (const node of nodes) {
      node.x(node.x() + dx);
      node.y(node.y() + dy);
    }
    this.transformer.forceUpdate();
    // 同步拖动基线，避免下次拖动发生跳变
    this.handlersManager[Handlers.SelectionHandlers.name].reset();
    // 连接线跟随
    this.connectorTool.refreshAll();

    if (record) {
      this.historyTool.updateHistory();
    }
  }
}

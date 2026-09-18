import type Konva from "konva";
import type { RenderConfig, MouseMode } from "./types";
import type { EventManager } from "./EventManager";
import type { Cursor } from "./Cursor";
import type { Shape } from "./Element/Shape";
import type { Text } from "./Element/Text";
import type { Image } from "./Element/Image";
import type { BgDraw } from "./draws/BgDraw";
import type { ContextmenuDraw } from "./draws/ContextmenuDraw";
import type { PaintTool } from "./tools/PaintTool";
import type { EraserTool } from "./tools/EraserTool";
import type { ConnectorTool } from "./tools/ConnectorTool";
import type { StyleTool } from "./tools/StyleTool";
import type { SelectionTool } from "./tools/SelectionTool";
import type { EditToolbar } from "./tools/EditToolbar";
import type { ZIndexTool } from "./tools/ZIndexTool";
import type { ImportExportTool } from "./tools/ImportExportTool";
import type { HistoryTool } from "./tools/HistoryTool";
import type { CopyTool } from "./tools/CopyTool";
import type { CanvasCommandTool } from "./tools/CanvasCommandTool";
import type { GroupTool } from "./tools/GroupTool";

export interface StageState {
  width: number;
  height: number;
  scale: number;
  x: number;
  y: number;
}

/**
 * 渲染核心提供给各工具、元素、绘制器、事件处理器的能力契约。
 *
 * 工具类依赖该接口而非 Render 具体类，以打破 Render 与工具之间的循环依赖，
 * 并为后续单元测试（可 mock 该接口）奠定基础。
 */
export interface ICanvasContext {
  container: HTMLDivElement;
  stage: Konva.Stage;
  layer: Konva.Layer;
  layerFloor: Konva.Layer;
  layerCover: Konva.Layer;
  config: RenderConfig;
  // 一次性工具绘制完成回调
  onToolFinish: (() => void) | null;
  bgSize: number;
  transformer: Konva.Transformer;
  selectRect: Konva.Rect;
  groupTransformer: Konva.Group;

  draws: { bg: BgDraw; contextmenu: ContextmenuDraw };
  events: EventManager;
  cursor: Cursor;
  shape: Shape;
  text: Text;
  image: Image;
  paintTool: PaintTool;
  eraserTool: EraserTool;
  connectorTool: ConnectorTool;
  styleTool: StyleTool;
  selectionTool: SelectionTool;
  editToolbar: EditToolbar;
  zIndexTool: ZIndexTool;
  importExportTool: ImportExportTool;
  historyTool: HistoryTool;
  copyTool: CopyTool;
  canvasTool: CanvasCommandTool;
  groupTool: GroupTool;

  workMode<T extends MouseMode>(
    workMode?: T,
    config?: T extends "brush" ? PaintTool.InitPaintConfig : undefined
  ): MouseMode;

  getStageState(): StageState;
  toStageValue(boardPos: number): number;
  toBoardValue(stagePos: number): number;
  ignore(node: Konva.Node): boolean;
  ignoreDraw(node: Konva.Node): boolean;
  setStageScale(scale: number): void;
  getPointerPosAfterStageChanged(): Konva.Vector2d | null;
  deleteSelectingElement(): void;
  moveSelectedBy(dx: number, dy: number, record?: boolean): void;
}

import type { ShapeType } from "./shapeTypes";

/**
 * 白板文档的纯数据模型。
 *
 * 这里是「文档真源」的定义：元素是可序列化的普通对象，不依赖 Konva / Vue / DOM。
 * 渲染层负责把模型投影为具体的图形节点，从而使历史、持久化、协作与测试都能脱离渲染引擎。
 */

export type ElementId = string;

export type ElementType =
  | "shape"
  | "text"
  | "image"
  | "paint"
  | "connector"
  | "group";

/** 所有元素共有的字段。x / y 为画布坐标下的包围盒左上角 */
export interface BoardElementBase {
  id: ElementId;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  /** 旋转角度（度） */
  angle: number;
  opacity: number;
  /** 每次修改自增，用于增量历史与协作协调 */
  version: number;
  versionNonce: number;
  /** 扁平化的分组 id 链（从内到外），便于序列化与协作 */
  groupIds: ElementId[];
}

export interface ShapeElement extends BoardElementBase {
  type: "shape";
  /** 内置形状；自定义 path 形状为 "path" */
  shape: ShapeType | "path";
  /** 自定义形状的 SVG path 数据（shape 为 "path" 时使用） */
  path?: string;
  fill: string;
  /** 形状内居中标签 */
  text?: string;
  fontSize: number;
}

export interface TextElement extends BoardElementBase {
  type: "text";
  text: string;
  fontSize: number;
  fill: string;
  fontFamily?: string;
}

export interface ImageElement extends BoardElementBase {
  type: "image";
  /** 图片地址（本地导入时为 base64） */
  src: string;
  /** 旧版内联 SVG 素材（无 src 时使用） */
  svgXML?: string;
}

export interface PaintElement extends BoardElementBase {
  type: "paint";
  /** 扁平化的点序列 [x0, y0, x1, y1, ...]，board 坐标；元素原点固定在 (0,0) */
  points: number[];
  stroke: string;
  strokeWidth: number;
  dash?: number[];
  /** 橡皮擦笔迹使用 destination-out */
  globalCompositeOperation?: "source-over" | "destination-out";
}

/** 连接线端点。绑定图形时以 nodeId + 锚点 / 相对中心偏移记录，board 坐标 */
export interface ConnectorEnd {
  nodeId?: ElementId;
  anchor?: string;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
}

export interface ConnectorElement extends BoardElementBase {
  type: "connector";
  ends: [ConnectorEnd, ConnectorEnd];
  stroke: string;
  strokeWidth: number;
}

/** 分组容器：保留子元素结构与自身变换，便于无损映射现有 Konva 分组 */
export interface GroupElement extends BoardElementBase {
  type: "group";
  scaleX: number;
  scaleY: number;
  children: BoardElement[];
}

export type BoardElement =
  | ShapeElement
  | TextElement
  | ImageElement
  | PaintElement
  | ConnectorElement
  | GroupElement;

/** 文档结构。后续增量历史、协作都在此之上演进 */
export interface Scene {
  elements: BoardElement[];
}

/** 文档格式版本，用于迁移 */
export const SCENE_VERSION = 1;

export interface SceneDocument {
  type: "xy-whiteboard";
  version: number;
  elements: BoardElement[];
}

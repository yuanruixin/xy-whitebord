import pathData from "./shapePathData.json";

/**
 * 内置形状类型。作为纯数据层定义，渲染层（Konva）从此处引用，
 * 避免形状枚举被绑定在具体渲染实现上。
 */
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

/** 形状类型 -> SVG path 数据 */
export const SHAPE_PATHS: Record<ShapeType, string> = pathData;

export const SHAPE_TYPES = Object.keys(SHAPE_PATHS) as ShapeType[];

const SHAPE_PATH_SET = new Set<string>(SHAPE_TYPES);

export function isShapeType(value: string): value is ShapeType {
  return SHAPE_PATH_SET.has(value);
}

/** 反查 SVG path 对应的内置形状类型（用于从数据识别元素类型） */
export function shapeTypeOfPath(path: string): ShapeType | null {
  for (const type of SHAPE_TYPES) {
    if (SHAPE_PATHS[type] === path) return type;
  }
  return null;
}

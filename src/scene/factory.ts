import { nanoid } from "nanoid";
import { DEFAULT_FONT_SIZE } from "@/constants/fontSize";
import type { ShapeType } from "./shapeTypes";
import type {
  BoardElement,
  BoardElementBase,
  ConnectorElement,
  ConnectorEnd,
  ElementType,
  GroupElement,
  ImageElement,
  PaintElement,
  ShapeElement,
  TextElement,
} from "./types";

export const DEFAULT_SHAPE_FILL = "#4e95ff";
export const DEFAULT_TEXT_FILL = "#1d293a";
export const DEFAULT_CONNECTOR_STROKE = "#1d293a";

export const DEFAULT_SHAPE_WIDTH = 160;
export const DEFAULT_SHAPE_HEIGHT = 80;
export const DEFAULT_TEXT_WIDTH = 200;
export const DEFAULT_TEXT_HEIGHT = 30;

let nonce = Math.floor(Math.random() * 0xffffffff);

/** 单调递增的随机数，配合 version 用于冲突协调 */
export function randomVersionNonce(): number {
  nonce = (nonce + 1) >>> 0;
  return nonce;
}

interface BaseInput {
  id?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  angle?: number;
  opacity?: number;
  groupIds?: string[];
}

function createBase(
  type: ElementType,
  input: BaseInput,
  fallback: { width: number; height: number }
): BoardElementBase {
  return {
    id: input.id ?? nanoid(),
    type,
    x: input.x ?? 0,
    y: input.y ?? 0,
    width: input.width ?? fallback.width,
    height: input.height ?? fallback.height,
    angle: input.angle ?? 0,
    opacity: input.opacity ?? 1,
    version: 1,
    versionNonce: randomVersionNonce(),
    groupIds: input.groupIds ?? [],
  };
}

export interface CreateShapeInput extends BaseInput {
  shape: ShapeType | "path";
  path?: string;
  fill?: string;
  text?: string;
  fontSize?: number;
}

export function createShapeElement(input: CreateShapeInput): ShapeElement {
  return {
    ...createBase("shape", input, {
      width: DEFAULT_SHAPE_WIDTH,
      height: DEFAULT_SHAPE_HEIGHT,
    }),
    type: "shape",
    shape: input.shape,
    path: input.path,
    fill: input.fill ?? DEFAULT_SHAPE_FILL,
    text: input.text,
    fontSize: input.fontSize ?? DEFAULT_FONT_SIZE,
  };
}

export interface CreateTextInput extends BaseInput {
  text?: string;
  fontSize?: number;
  fill?: string;
  fontFamily?: string;
}

export function createTextElement(input: CreateTextInput): TextElement {
  return {
    ...createBase("text", input, {
      width: DEFAULT_TEXT_WIDTH,
      height: DEFAULT_TEXT_HEIGHT,
    }),
    type: "text",
    text: input.text ?? "文本",
    fontSize: input.fontSize ?? DEFAULT_FONT_SIZE,
    fill: input.fill ?? DEFAULT_TEXT_FILL,
    fontFamily: input.fontFamily,
  };
}

export interface CreateImageInput extends BaseInput {
  src: string;
}

export function createImageElement(input: CreateImageInput): ImageElement {
  return {
    ...createBase("image", input, { width: 0, height: 0 }),
    type: "image",
    src: input.src,
  };
}

export interface CreatePaintInput extends BaseInput {
  points: number[];
  stroke?: string;
  strokeWidth?: number;
  dash?: number[];
}

export function createPaintElement(input: CreatePaintInput): PaintElement {
  return {
    ...createBase("paint", input, { width: 0, height: 0 }),
    type: "paint",
    points: input.points,
    stroke: input.stroke ?? "#000000",
    strokeWidth: input.strokeWidth ?? 1,
    dash: input.dash,
  };
}

export interface CreateConnectorInput extends BaseInput {
  ends: [ConnectorEnd, ConnectorEnd];
  stroke?: string;
  strokeWidth?: number;
}

/** 由两端点计算包围盒，连接线以 board 坐标记录端点，元素原点固定在 (0,0) */
function boundsOfEnds(ends: [ConnectorEnd, ConnectorEnd]) {
  const xs = [ends[0].x, ends[1].x];
  const ys = [ends[0].y, ends[1].y];
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return {
    x: 0,
    y: 0,
    width: Math.max(...xs) - minX,
    height: Math.max(...ys) - minY,
  };
}

export function createConnectorElement(
  input: CreateConnectorInput
): ConnectorElement {
  const bounds = boundsOfEnds(input.ends);
  return {
    ...createBase(
      "connector",
      { ...input, x: bounds.x, y: bounds.y },
      bounds
    ),
    type: "connector",
    ends: input.ends,
    stroke: input.stroke ?? DEFAULT_CONNECTOR_STROKE,
    strokeWidth: input.strokeWidth ?? 2,
  };
}

export interface CreateGroupInput extends BaseInput {
  children: BoardElement[];
  scaleX?: number;
  scaleY?: number;
}

export function createGroupElement(input: CreateGroupInput): GroupElement {
  return {
    ...createBase("group", input, { width: 0, height: 0 }),
    type: "group",
    scaleX: input.scaleX ?? 1,
    scaleY: input.scaleY ?? 1,
    children: input.children,
  };
}

import Konva from "konva";
import type { ICanvasContext } from "./context";

export type ValueOf<T> = T[keyof T];

export interface RenderConfig {
  showBg?: boolean;
  attractResize?: boolean
  attractBg?: boolean
  attractNode?: boolean
}

export interface Handler {
  handlers?: {
    stage?: {
      [index: string]: (e?: any) => void;
    };
    dom?: {
      [index: string]: (e?: any) => void;
    };
    transformer?: {
      [index: string]: (e?: any) => void;
    };
  };
  transformerConfig?: {
    anchorDragBoundFunc?: (
      oldPos: Konva.Vector2d,
      newPos: Konva.Vector2d,
      e: MouseEvent
    ) => Konva.Vector2d;
    dragBoundFunc?: (newPos: Konva.Vector2d, e: MouseEvent) => Konva.Vector2d;
  };
}

export enum MouseButton {
  left = 0,
  middle = 1,
  right = 2,
}

export interface Draw {
  option: {
    [index: string]: any;
  };
  init: () => void;
  draw: () => void;
  clear: () => void;
}

export class BaseDraw {
  protected render: ICanvasContext;
  readonly layer: Konva.Layer;
  readonly group: Konva.Group;

  constructor(render: ICanvasContext, layer: Konva.Layer) {
    this.render = render;
    this.layer = layer;

    this.group = new Konva.Group();
  }

  init() {
    this.layer.add(this.group);
    this.draw();
  }

  draw() {}

  clear() {
    // 重置
    this.group.removeChildren();
  }
}

export interface AssetInfo {
  url: string;
}

export enum MoveKey {
  up = "ArrowUp",
  left = "ArrowLeft",
  right = "ArrowRight",
  down = "ArrowDown",
}
export enum ShortcutKey {
  Delete = 'Delete',
  C = 'KeyC',
  V = 'KeyV',
  Z = 'KeyZ',
  Y = 'KeyY',
  A = 'KeyA',
  R = 'KeyR',
  Esc = 'Escape',
  Backspace = 'Backspace'
}
export type CursorType =
  | "default"
  | "move"
  | "eraser"
  | "crosshair"
  | "grab"
  | "brush"
  | "none";

export type  MouseMode =  "createElement"
| "brush"
| "eraser"
| "select"
| "drag"
| "default" 
| "createText" 
| "connector"

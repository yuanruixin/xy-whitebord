import type Konva from "konva";
import type { ICanvasContext } from "@/Render/context";

/** 快捷键描述。code 使用 KeyboardEvent.code，避免布局差异 */
export interface ShortcutSpec {
  code: string;
  /** 同时接受 Ctrl（Windows/Linux）或 Cmd（macOS） */
  ctrlOrMeta?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export interface ActionContext {
  render: ICanvasContext;
}

export interface ActionArgs {
  /** 右键菜单等场景下的目标节点 */
  target?: Konva.Node | null;
  event?: Event;
}

/** 动作的适用范围，决定是否出现在右键菜单 */
export type ActionScope = "selection" | "canvas";

export interface BoardAction {
  name: string;
  label: string;
  scope: ActionScope | "global";
  shortcuts?: ShortcutSpec[];
  /** 是否可用；同时决定菜单是否展示、快捷键是否触发 */
  enabled?: (ctx: ActionContext) => boolean;
  perform: (ctx: ActionContext, args?: ActionArgs) => void;
}

import type Konva from "konva";
import * as Types from "@/Render/types";
import type { ICanvasContext } from "@/Render/context";
import { matchShortcut } from "./keyboard";
import type { ActionArgs, ActionContext, BoardAction } from "./types";

/**
 * 动作注册表：把「复制 / 删除 / 层级 / 成组 / 撤销…」等操作集中定义一次，
 * 供快捷键与右键菜单共同派生，避免同一行为在多个入口重复实现。
 */
export class ActionManager {
  readonly actions: BoardAction[];
  private ctx: ActionContext;

  constructor(render: ICanvasContext) {
    this.ctx = { render };
    this.actions = createActions();
  }

  /** 命中快捷键（要求 enabled） */
  match(event: KeyboardEvent): BoardAction | null {
    for (const action of this.actions) {
      if (!action.shortcuts) continue;
      if (!action.shortcuts.some((spec) => matchShortcut(event, spec))) continue;
      if (action.enabled && !action.enabled(this.ctx)) continue;
      return action;
    }
    return null;
  }

  run(action: BoardAction, args?: ActionArgs) {
    if (action.enabled && !action.enabled(this.ctx)) return;
    action.perform(this.ctx, args);
  }

  runByName(name: string, args?: ActionArgs) {
    const action = this.actions.find((item) => item.name === name);
    if (action) this.run(action, args);
  }

  /** 右键菜单项：target 为空表示空白画布 */
  menu(target: Konva.Node | null): BoardAction[] {
    const scope: BoardAction["scope"] = target ? "selection" : "canvas";
    return this.actions.filter(
      (action) =>
        action.scope === scope && (!action.enabled || action.enabled(this.ctx))
    );
  }
}

function createActions(): BoardAction[] {
  return [
    {
      name: "copy",
      label: "复制",
      scope: "selection",
      shortcuts: [{ code: Types.ShortcutKey.C, ctrlOrMeta: true }],
      perform: (ctx, args) => {
        const target = args?.target;
        if (target) {
          ctx.render.copyTool.copy([target]);
        } else {
          ctx.render.copyTool.pasteStart();
        }
      },
    },
    {
      name: "paste",
      label: "粘贴",
      scope: "canvas",
      shortcuts: [{ code: Types.ShortcutKey.V, ctrlOrMeta: true }],
      perform: (ctx) => ctx.render.copyTool.pasteEnd(),
    },
    {
      name: "undo",
      label: "撤销",
      scope: "global",
      shortcuts: [{ code: Types.ShortcutKey.Z, ctrlOrMeta: true }],
      perform: (ctx) => ctx.render.historyTool.prevHistory(),
    },
    {
      name: "redo",
      label: "反撤销",
      scope: "global",
      shortcuts: [{ code: Types.ShortcutKey.Y, ctrlOrMeta: true }],
      perform: (ctx) => ctx.render.historyTool.nextHistory(),
    },
    {
      name: "selectAll",
      label: "全选",
      scope: "global",
      shortcuts: [{ code: Types.ShortcutKey.A, ctrlOrMeta: true }],
      perform: (ctx) => {
        ctx.render.selectionTool.selectAll();
        ctx.render.workMode("select");
      },
    },
    {
      name: "group",
      label: "成组",
      scope: "selection",
      shortcuts: [{ code: Types.ShortcutKey.G, ctrlOrMeta: true }],
      enabled: (ctx) => ctx.render.groupTool.canGroup(),
      perform: (ctx) => ctx.render.groupTool.group(),
    },
    {
      name: "ungroup",
      label: "解组",
      scope: "selection",
      shortcuts: [{ code: Types.ShortcutKey.G, ctrlOrMeta: true, shift: true }],
      enabled: (ctx) => ctx.render.groupTool.canUngroup(),
      perform: (ctx) => ctx.render.groupTool.ungroup(),
    },
    {
      name: "delete",
      label: "删除",
      scope: "selection",
      shortcuts: [
        { code: Types.ShortcutKey.Delete },
        { code: Types.ShortcutKey.Backspace },
      ],
      perform: (ctx) => ctx.render.deleteSelectingElement(),
    },
    {
      name: "escape",
      label: "取消选择",
      scope: "global",
      shortcuts: [{ code: Types.ShortcutKey.Esc }],
      perform: (ctx) => ctx.render.selectionTool.selectingClear(),
    },
    {
      name: "reload",
      label: "刷新页面",
      scope: "global",
      shortcuts: [{ code: Types.ShortcutKey.R, ctrlOrMeta: true }],
      perform: () => window.location.reload(),
    },
    {
      name: "zIndexUp",
      label: "上移",
      scope: "selection",
      perform: (ctx, args) => ctx.render.zIndexTool.up(targetsOf(ctx, args)),
    },
    {
      name: "zIndexDown",
      label: "下移",
      scope: "selection",
      perform: (ctx, args) => ctx.render.zIndexTool.down(targetsOf(ctx, args)),
    },
    {
      name: "zIndexTop",
      label: "置顶",
      scope: "selection",
      perform: (ctx, args) => ctx.render.zIndexTool.top(targetsOf(ctx, args)),
    },
    {
      name: "zIndexBottom",
      label: "置底",
      scope: "selection",
      perform: (ctx, args) => ctx.render.zIndexTool.bottom(targetsOf(ctx, args)),
    },
  ];
}

// 层级操作目标：右键节点优先，否则作用于当前选择
function targetsOf(ctx: ActionContext, args?: ActionArgs): Konva.Node[] {
  const target = args?.target;
  if (target) return [target];
  return [...ctx.render.selectionTool.selectingNodes];
}

import type { ShortcutSpec } from "./types";

/**
 * 判断键盘事件是否命中快捷键。
 * 未在 spec 中声明的修饰键要求为「未按下」，避免 Ctrl+Delete 误触发 Delete。
 */
export function matchShortcut(e: KeyboardEvent, spec: ShortcutSpec): boolean {
  if (e.code !== spec.code) return false;

  const ctrlOrMeta = e.ctrlKey || e.metaKey;
  if (ctrlOrMeta !== (spec.ctrlOrMeta ?? false)) return false;
  if (e.shiftKey !== (spec.shift ?? false)) return false;
  if (e.altKey !== (spec.alt ?? false)) return false;

  return true;
}

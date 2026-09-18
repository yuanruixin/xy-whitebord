import { ref } from "vue";
import { useRenderStore } from "@/store/render";
import { useSelectionStore } from "@/store/selection";
import type { CanvasNodeInfo } from "@/utils/ai";
import { buildSelectionText } from "../aiChatHelpers";

// 已引用（附加到本次提问）的图形
const pinnedSelection = ref<CanvasNodeInfo[]>([]);

/**
 * 选中图形引用：把画布上当前选中的元素附加到本次提问。
 */
export function useSelectionReference() {
  const { render } = useRenderStore();
  const selection = useSelectionStore();

  function pinSelection() {
    const merged = new Map<string, CanvasNodeInfo>();
    [...pinnedSelection.value, ...selection.value].forEach((node) =>
      merged.set(node.id, node)
    );
    pinnedSelection.value = [...merged.values()];
  }

  function clearPinnedSelection() {
    pinnedSelection.value = [];
  }

  // 生成选中元素的上下文描述（按 id 解析最新位置）
  function buildSelectionContext(): string {
    if (pinnedSelection.value.length === 0 || !render.value) return "";
    const ids = pinnedSelection.value.map((node) => node.id);
    const data = render.value.canvasTool.getCanvas().data as
      | { nodes?: CanvasNodeInfo[] }
      | undefined;
    const nodes = (data?.nodes ?? []).filter((node) => ids.includes(node.id));
    if (nodes.length === 0) return "";
    return buildSelectionText(nodes);
  }

  return {
    selection,
    pinnedSelection,
    pinSelection,
    clearPinnedSelection,
    buildSelectionContext,
  };
}

import { ref } from "vue";
import type { CanvasNodeInfo } from "@/utils/ai/types";

/**
 * 画布当前选中的元素信息（响应式），供 AI 侧边栏「引用选中图形」等功能使用。
 * 由 EditToolbar 在每次选择变化时同步。
 */
const selectedNodes = ref<CanvasNodeInfo[]>([]);

export function useSelectionStore() {
  return selectedNodes;
}

export function setSelectedNodes(nodes: CanvasNodeInfo[]) {
  selectedNodes.value = nodes;
}

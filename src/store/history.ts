import { reactive } from "vue";

/**
 * 撤销/重做可用状态，供历史按钮响应式渲染。
 */
export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
}

const state = reactive<HistoryState>({
  canUndo: false,
  canRedo: false,
});

export function useHistoryState() {
  return state;
}

export function setHistoryState(patch: Partial<HistoryState>) {
  Object.assign(state, patch);
}

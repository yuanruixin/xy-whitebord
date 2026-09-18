import { reactive } from "vue";

export type DashStyle = "solid" | "dashed" | "dotted";
export type TextAlign = "left" | "center" | "right";

/**
 * 选中元素的属性状态，供属性面板响应式渲染。
 * 值为 null 表示当前选中类型不支持该项。
 */
export interface SelectionStyle {
  visible: boolean;
  // 主色：图形填充 / 文本颜色 / 线条颜色
  color: string | null;
  // 图形描边色
  strokeColor: string | null;
  strokeWidth: number | null;
  dash: DashStyle | null;
  // 0 - 100
  opacity: number;
  fontSize: number | null;
  fontFamily: string | null;
  bold: boolean;
  italic: boolean;
  align: TextAlign;
}

const state = reactive<SelectionStyle>({
  visible: false,
  color: null,
  strokeColor: null,
  strokeWidth: null,
  dash: null,
  opacity: 100,
  fontSize: null,
  fontFamily: null,
  bold: false,
  italic: false,
  align: "left",
});

export function useSelectionStyle() {
  return state;
}

export function setSelectionStyle(patch: Partial<SelectionStyle>) {
  Object.assign(state, patch);
}

export function resetSelectionStyle() {
  setSelectionStyle({
    visible: false,
    color: null,
    strokeColor: null,
    strokeWidth: null,
    dash: null,
    opacity: 100,
    fontSize: null,
    fontFamily: null,
    bold: false,
    italic: false,
    align: "left",
  });
}

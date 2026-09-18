import { shallowRef } from "vue";
import type { Render } from "@/Render";

// 渲染实例。使用 shallowRef 持有，避免实例（含 Konva 对象）被深度响应式代理，
// 仅在实例就绪（null → 实例）时触发一次响应。
const render = shallowRef<Render | null>(null);

export function useRenderStore() {
  return { render };
}

export function setRender(instance: Render | null) {
  render.value = instance;
}

import { render, h } from "vue";
import ColorPicker from "./ColorPicker.vue";
import type { Props } from "./type";

let container: HTMLDivElement | null = null;
export function PickColor(
  config: Pick<Props, "defaultColor" | "pos">,
  callback: Props["callback"]
) {
  const props: Props = {
    defaultColor: config.defaultColor,
    // 相对于视口的位置
    pos: config.pos,
    callback,
  };

  if (!container) {
    container = document.createElement("div");
    container.classList.add("action-bar");
  }
  const vNode = h(ColorPicker, props);

  document.body.appendChild(container);
  render(vNode, container);
  PickColor.isExist = true;
}

// 关闭工具

PickColor.close = function () {
  if (container) {
    render(null, container);
  }
  PickColor.isExist = false;
};

PickColor.isExist = false;
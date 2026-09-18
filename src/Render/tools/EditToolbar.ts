import type { ICanvasContext } from "../context";
import { resetSelectionStyle, setSelectionStyle } from "@/store/selectionStyle";

/**
 * 选中元素时的编辑入口：把当前选中样式同步到属性面板。
 */
export class EditToolbar {
  render: ICanvasContext;
  constructor(render: ICanvasContext) {
    this.render = render;
  }

  // 根据当前选中刷新属性面板
  init() {
    if (this.render.selectionTool.selectingNodes.length === 0) {
      resetSelectionStyle();
      return;
    }
    setSelectionStyle(this.render.styleTool.getStyle());
  }

  // 关闭属性面板
  close() {
    resetSelectionStyle();
  }
}

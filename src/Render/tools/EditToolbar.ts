import type { ICanvasContext } from "../context";
import { resetSelectionStyle, setSelectionStyle } from "@/store/selectionStyle";
import { setSelectedNodes } from "@/store/selection";

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
    } else {
      setSelectionStyle(this.render.styleTool.getStyle());
    }
    // 同步选中元素信息（供 AI 侧边栏引用）
    setSelectedNodes(this.render.canvasTool.getSelection());
    // 单选连接线时显示端点手柄
    this.render.connectorTool.updateHandles();
  }

  // 关闭属性面板
  close() {
    resetSelectionStyle();
  }
}

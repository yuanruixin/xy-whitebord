import { Render } from "../types";
import Konva from "konva";
import { PickColor } from "@/components/ColorPicker";
export class EditToolbar{
  render: Render
  constructor(render: Render){
    this.render = render
  }
  // 初始化编辑工具条
  init(){
    this.initPickColorToolbar()
  }
  initPickColorToolbar() {
    if (this.render.selectionTool.selectingNodes.length !== 0) {
      const transformerBound = this.render.transformer.getClientRect();
      
      const pos ={
        x: transformerBound.x ,
        y: transformerBound.y - 20 
      }
      // 边界处理防止超出屏幕
      if(pos.y<=10){
        pos.y = pos.y + transformerBound.height 
      }
      // 存储颜色列表，取最新的两个显示
      const colors: string[] = [];
      this.render.selectionTool.selectingNodes.forEach((item) => {
        if (item instanceof Konva.Group) {
          item.children.forEach((node) => {
            if (node instanceof Konva.Line) {
              colors.push(node.stroke());
            } else if (
              node instanceof Konva.Path ||
              node instanceof Konva.Text
            ) {
              // 图形
              colors.push(node.fill());
            }
          });
        }
      });

      if (colors.length === 0) return;
      // 设置颜色
      PickColor({ defaultColor: colors[0] || "red", pos }, (color) => {
        this.render.selectionTool.selectingNodes.forEach((item) => {
          if (!(item instanceof Konva.Group)) return;
          item.children.forEach((node) => {
            if (node instanceof Konva.Line) {
              node.stroke(color);
            } else if (node instanceof Konva.Path) {
              node.fill(color);
            } else if (node instanceof Konva.Text) {
              node.fill(color);
              if (this.render.text.textarea) {
                this.render.text.textarea.style.color = color;
              }
            }
          });
        });
      });
    } else if (this.render.selectionTool.selectingNodes.length === 0) {
      PickColor.close();
    }
    
  }

  // 文字编辑工具条
  initTextEdit() {
  
  }
  // 
    // 更新位置
  updatePos() {

  }
}
import { ref } from "vue";
const selectedTool = ref<ToolType>("select");
type ToolType =
  | "createShape"
  | "picture"
  | "brush"
  | "eraser"
  | "drag"
  | 'elbowed' //连接线
  | "select"   
  | "text"   

export const useTool = () => {
  function isActiveTool(name: ToolType) {
    return name === selectedTool.value;
  }
  function clearSelectedTool() {
    selectedTool.value = 'select';
  }
  // 一些工具，比如创建图形，需要在创建完成后，自动切换到选择工具
//这里需要重写render的workMode方法，将工具切换逻辑放到这里
  return {
    selectedTool,
    clearSelectedTool,
    isActiveTool,
  };
};

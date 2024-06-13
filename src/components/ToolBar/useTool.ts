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

export const useTool = () => {
  function isActiveTool(name: ToolType) {
    return name === selectedTool.value;
  }
  function clearSelectedTool() {
    selectedTool.value = 'select';
  }
  return {
    selectedTool,
    clearSelectedTool,
    isActiveTool,
  };
};

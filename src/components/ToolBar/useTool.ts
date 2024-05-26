import { ref } from "vue";

const selectedTool = ref<ToolType>("default");
type ToolType =
  | "createShape"
  | "picture"
  | "brush"
  | "eraser"
  | "drag"
  | "select"
  | "default"
  | "none";

export const useTool = () => {
  function isActiveTool(name: ToolType) {
    return name === selectedTool.value;
  }
  function clearSelectedTool() {
    selectedTool.value = 'none';
  }
  return {
    selectedTool,
    clearSelectedTool,
    isActiveTool,
  };
};

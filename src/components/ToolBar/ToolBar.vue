<template>
  <div
    class="fixed top-24  left-3 flex flex-col w-min pb-1 rounded-md border border-blue text-white bg-[#1d293a]"
  >
    <!-- 主要选择区域 -->
    <ul class="flex flex-col items-center p-2 gap-y-0.5 select-none">
      <!-- 模板 -->
      <li
        class="cursor-pointer hover:bg-gray-700 rounded-md overflow-hidden"
        v-tooltip="'模板'"
      >
        <TemplateTool></TemplateTool>
      </li>
      <!-- 形状选择工具 -->
      <li class="cursor-pointer rounded-md overflow-hidden">
        <ShapesTool class="w-12 h-12"></ShapesTool>
      </li>
    </ul>
    <div
      class="divider m-0 w-3/5 relative left-[20%] h-[1px] bg-slate-400/20"
    ></div>
    <!-- 副功能区 -->
    <MinorTool></MinorTool>

    <div
      class="divider m-0 w-3/5 relative left-[20%] h-[1px] bg-slate-400/20"
    ></div>
    <!-- 触摸模式(选择、拖拽) -->
    <div class="flex flex-col items-center p-2" @click="toggleStageDragable">
      <span
        class="w-10 h-10 p-0 flex justify-center items-center cursor-pointer rounded-md overflow-hidden"
        :class="{'bg-primary':isActiveTool('select')||isActiveTool('drag')}"
        v-tooltip="stageDraggable ? '拖拽画布' : '选择'"
        >
        <svg-icon
          prefix="menu"
          name="pointer"
          :size="24"
          class="hover:animate-swing-small"
          v-show="!stageDraggable"
        ></svg-icon>
        <svg-icon
          prefix="menu"
          name="hand"
          :size="24"
          v-show="stageDraggable"
          class="hover:animate-swing-small"
        ></svg-icon>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import SvgIcon from "@/components/SvgIcon/SvgIcon.vue";
import ShapesTool from "./ShapesTool.vue";
import MinorTool from "./MinorTool.vue";
import { useRenderStore } from "@/store/render";
import { useTool } from "./useTool";
import TemplateTool from "@/components/TemplateTool/TemplateTool.vue";

const { render } = useRenderStore();
const stageDraggable = ref(false);
const { selectedTool,isActiveTool } = useTool();

// 修改工作模式
function toggleStageDragable() {
  if (selectedTool.value === "select" || selectedTool.value === "drag") {
    stageDraggable.value = !stageDraggable.value;
  }
  selectedTool.value=stageDraggable.value ? "drag" : "select"
  render.value?.workMode(stageDraggable.value ? "drag" : "default");
}
</script>

<style scoped></style>

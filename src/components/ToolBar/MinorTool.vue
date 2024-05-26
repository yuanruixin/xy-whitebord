<template>
  <ul class="flex flex-col items-center p-2 gap-y-0.5">
    <!-- 画笔工具 -->
    <li
      class="cursor-pointer hover:bg-gray-700 rounded-md"
      :class="{ 'bg-primary hover:bg-primary': isActiveTool('brush') }"
      @click="paintToolToggle"
    >
      <a class="w-10 h-10 p-0 flex justify-center items-center">
        <svg-icon
          prefix="menu"
          name="brush"
          :size="48"
          class="hover:animate-swing-small"
        ></svg-icon>
      </a>
    </li>
    <!-- 折线 -->
    <li class="cursor-pointer hover:bg-gray-700 rounded-md">
      <a class="w-10 h-10 p-0 flex justify-center items-center">
        <svg-icon
          prefix="menu"
          name="elbowed"
          :size="48"
          class="hover:animate-swing-small"
        ></svg-icon>
      </a>
    </li>
    <li
      class="cursor-pointer hover:bg-gray-700 rounded-md"
      :class="{ 'bg-primary hover:bg-primary': isActiveTool('picture') }"
      @click="selectedTool = 'picture'"
    >
      <a class="w-10 h-10 p-0 flex justify-center items-center">
        <svg-icon
          prefix="menu"
          name="picture"
          :size="48"
          class="hover:animate-swing-small"
        ></svg-icon>
      </a>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { watch } from "vue";
import { useTool } from "./useTool";
import { defineRenderStore } from "@/store/render";
import { render } from "vue";
const { selectedTool, isActiveTool, clearSelectedTool } = useTool();
const renderStore = defineRenderStore();

function paintToolToggle() {
  if (isActiveTool("brush")) {
    clearSelectedTool()
  };
  selectedTool.value = "brush";

  renderStore.render?.paintTool.init();
}

// 工具切换时，销毁旧工具（事件监听、样式等）
watch(
  () => selectedTool.value,
  (newVal, oldVal) => {
    if (oldVal === "brush" && newVal !== oldVal) {
      renderStore.render?.paintTool.destroy();
    }
  }
);

</script>

<style scoped></style>
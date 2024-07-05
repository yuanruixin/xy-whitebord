<template>
  <ul class="flex flex-col items-center p-2 gap-y-0.5">
    <!-- 画笔工具 -->
    <li
      class="cursor-pointer hover:bg-gray-700 rounded-md"
      :class="{ 'bg-primary hover:bg-primary': isActiveTool('brush') }"
      @click="toggleTool('brush')"
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
    <!-- 文本工具 -->
    <li
      class="cursor-pointer hover:bg-gray-700 rounded-md"
      :class="{ 'bg-primary hover:bg-primary': isActiveTool('text') }"
      @click="toggleTool('text')"
    >
      <a class="w-10 h-10 p-0 flex justify-center items-center">
        <svg-icon
          prefix="menu"
          name="text"
          :size="48"
          class="hover:animate-swing-small"
        ></svg-icon>
      </a>
    </li>
    <!-- 折线 -->
    <li
      class="cursor-pointer hover:bg-gray-700 rounded-md"
      :class="{ 'bg-primary hover:bg-primary': isActiveTool('elbowed') }"
      @click="selectedTool = 'elbowed'"
    >
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
      @click="toggleTool('picture')"
    >
      <a class="w-10 h-10 p-0 flex justify-center items-center">
        <svg-icon
          prefix="menu"
          name="picture"
          :size="48"
          class="hover:animate-swing-small"
        ></svg-icon>
      </a>
      <input
        ref="pictureInputRef"
        type="file"
        accept="image/*"
        class="hidden"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { watch, ref } from "vue";
import { useTool } from "./useTool";
import { defineRenderStore } from "@/store/render";
import { onMounted } from "vue";
const { selectedTool, isActiveTool, clearSelectedTool } = useTool();
const renderStore = defineRenderStore();

// 工具切换时，销毁旧工具（事件监听、样式等）
watch(
  () => selectedTool.value,
  (newVal, oldVal) => {
    if (oldVal === "brush" && newVal !== oldVal) {
      renderStore.render?.paintTool.destroy();
    }
  }
);
const pictureInputRef = ref<HTMLInputElement | null>();
// 获取用户选择文件的URL
onMounted(() => {
  pictureInputRef.value?.addEventListener("change", (e) => {
    const target = e.target as HTMLInputElement;
    if (!target.files) return;
    const url = URL.createObjectURL(target.files[0]);

    renderStore.render?.image.create({ src: url });
    clearSelectedTool();
  });
});

function toggleTool(tool: "picture" | "brush" | "text") {
  if(isActiveTool(tool)){
    clearSelectedTool();
  }
  selectedTool.value = tool;
  if (tool === "picture") {
    pictureInputRef.value?.click();
    setTimeout(() => {
      clearSelectedTool();
    }, 500);
  } else if (tool === "brush") {
    // renderStore.render?.paintTool.init();
    renderStore.render?.workMode('brush')   
  } else if (tool === "text") {
    renderStore.render?.workMode('createText')
  }
}

</script>

<style scoped></style>

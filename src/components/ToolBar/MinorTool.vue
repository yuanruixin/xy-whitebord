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
      <input type="file" accept="image/*" id="imgInput" class="hidden" />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { watch } from "vue";
import { useTool } from "./useTool";
import { defineRenderStore } from "@/store/render";
import { onMounted } from "vue";
const { selectedTool, isActiveTool, clearSelectedTool } = useTool();
const renderStore = defineRenderStore();

function paintToolToggle() {
  if (isActiveTool("brush")) {
    clearSelectedTool();
  }
  selectedTool.value = "brush";
  renderStore.render?.paintTool.init();
}

// 工具切换时，销毁旧工具（事件监听、样式等）
watch(
  () => selectedTool.value,
  (newVal, oldVal) => {
    if (oldVal === "brush" && newVal !== oldVal) {
      renderStore.render?.paintTool.destroy();
    } else if (newVal === "picture") {
      const inputEl = document.querySelector("#imgInput") as HTMLInputElement;
      inputEl.click();
    }
  }
);
// 获取用户选择文件的URL
onMounted(() => {
  const inputEl = document.querySelector("#imgInput") as HTMLInputElement;

  inputEl.addEventListener("change", (e) => {
    console.log(inputEl, 1112);
    const target = e.target as HTMLInputElement;
    if (!target.files) return;
    const url = URL.createObjectURL(target.files[0]);
   
    renderStore.render?.image.create({ src: url });
    // const reader = new FileReader();
    // reader.onload = (e) => {
    //   const base64String = e.target?.result;
    //   if(typeof(base64String) === "string"){
    //     renderStore.render?.image.create({src:base64String})
    //   }
    // };
    // reader.readAsDataURL(target.files[0]);
    clearSelectedTool();
  });
});
</script>

<style scoped></style>

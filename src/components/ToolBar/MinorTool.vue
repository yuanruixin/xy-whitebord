<template>
  <ul class="flex flex-col items-center p-2 gap-y-0.5">
    <!-- 画笔工具 -->
    <li
      class="relative hover:bg-gray-700 rounded-md"
      :class="{ 'bg-primary hover:bg-primary': isActiveTool('brush') }"
    >
      <a
        class="w-10 h-10 p-0 flex justify-center items-center cursor-pointer"
        @click="toggleTool('brush')"
      >
        <svg-icon
          prefix="menu"
          name="brush"
          :size="48"
          class="hover:animate-swing-small"
          v-tooltip="'画笔'"
        ></svg-icon>

        <div
          class="brush-optionMenu absolute left-full bg-[#1d232a] rounded-md translate-x-4 select-none"
          v-show="selectedTool === 'brush'"
        >
          <div class="flex flex-col gap-y-4 p-2">
            <div class="flex items-center gap-x-2 justify-between">
              <label for="brushWidth" class="w-max">画笔宽度</label>
              <input
                id="brushWidth"
                type="number"
                min="1"
                max="10"
                v-model="brushOption.lineWidth"
                class="w-16 p-1 border text-black rounded-md"
              />
            </div>
            <div class="flex items-center justify-between">
              <label for="solidStyle" class="cursor-pointer">
                <input
                  type="radio"
                  id="solidStyle"
                  name="lineStyle"
                  value="solid"
                  v-model="brushOption.lineStyle"
                />
                实线
              </label>

              <label for="dottedStyle" class="cursor-pointer">
                <input
                  type="radio"
                  id="dottedStyle"
                  name="lineStyle"
                  value="dotted"
                  v-model="brushOption.lineStyle"
                />
                虚线</label
              >
            </div>
            <div class="flex items-center gap-x-2 justify-between">
              <label for="brushColor">画笔颜色</label>
              <input
                id="brushColor"
                type="color"
                class="w-6 p-1 border border-gray-300 rounded-md"
                v-model="brushOption.color"
              />
            </div>
            <!-- 画笔样式（实线与虚线） -->
          </div>
        </div>
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
          v-tooltip="'文本'"
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
          v-tooltip="'图片'"
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
import { useRenderStore } from "@/store/render";
import { onMounted, reactive } from "vue";
import { readFileAsDataURL } from "@/utils/handleFile";
const { selectedTool, isActiveTool, clearSelectedTool } = useTool();
const { render } = useRenderStore();

// 工具切换时，销毁旧工具（事件监听、样式等）
watch(
  () => selectedTool.value,
  (newVal, oldVal) => {
    if (oldVal === "brush" && newVal !== oldVal) {
      render.value?.paintTool.destroy();
    }
  }
);
const pictureInputRef = ref<HTMLInputElement | null>();
// 获取用户选择文件的URL
onMounted(() => {
  pictureInputRef.value?.addEventListener("change", async (e) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    // 使用 base64，保证导出 JSON / 持久化后仍可再次导入
    const src = await readFileAsDataURL(file);
    render.value?.image.create({ src });
    // 允许重复选择同一文件
    target.value = "";
    clearSelectedTool();
  });
});

const brushOption:{
  lineWidth: number,
  lineStyle: "solid"|'dotted',
  color: string,
} = reactive({
  lineWidth: 2,
  lineStyle: "solid",
  color: "#000000",
});

watch(
  () => brushOption,
  (newVal) => {
    render.value?.paintTool.init(newVal);
  }
);
function toggleTool(tool: "picture" | "brush" | "text") {
  if (isActiveTool(tool)) {
    clearSelectedTool();
  }
  selectedTool.value = tool;
  if (tool === "picture") {
    pictureInputRef.value?.click();
    setTimeout(() => {
      clearSelectedTool();
    }, 500);
  } else if (tool === "brush") {
    render.value?.workMode("brush", brushOption);
  } else if (tool === "text") {
    render.value?.workMode("createText");

    render.value?.container.addEventListener("click", completeCreate);
  }
  function completeCreate() {
    clearSelectedTool();
    render.value?.container.removeEventListener("click", completeCreate);
  }
}
</script>

<style scoped></style>

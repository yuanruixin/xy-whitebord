<template>
  <div
    class="fixed flex items-center top-0 left-0 z-50"
    :class="props.onFontSize ? 'bg-white shadow-md rounded-md' : ''"
    :style="`top:${props.pos.y}px;left:${props.pos.x}px`"
  >
    <div
      class="relative flex gap-x-1 px-1 py-2 items-center cursor-pointer hover:bg-slate-600/10"
      @click="show = !show"
    >
      <span
        class="current-color size-6 rounded-full"
        :style="{ backgroundColor: selectedColor || 'black' }"
      ></span>
      <span class="icon-[octicon--chevron-down-24]"></span>
      <ul
        class="absolute z-10 top-full left-1/2 -translate-x-1/2 left colors grid grid-cols-[repeat(8,min-content)] items-center rounded-md overflow-hidden bg-slate-800"
        v-show="show"
      >
        <li
          class="size-10 flex justify-center items-center"
          v-for="color in props.colors"
          :key="color"
        >
          <div
            class="color-wrapper size-8 flex justify-center items-center rounded-full hover:border-white hover:border-2 cursor-pointer"
            :class="{ 'border-2 border-[#2878ff]': selectedColor === color }"
            @click="selectColor(color)"
          >
            <div
              class="color-cicle size-6 rounded-full"
              :style="{ backgroundColor: color }"
            ></div>
          </div>
        </li>
      </ul>
    </div>
    <!-- 字号设置（选中文本时显示） -->
    <div
      v-if="props.onFontSize"
      class="flex items-center gap-x-1 px-2 py-2 border-l border-slate-500/20"
    >
      <button
        v-for="preset in fontSizes"
        :key="preset.label"
        type="button"
        class="w-7 h-6 rounded text-xs cursor-pointer"
        :class="
          preset.value === selectedFontSize
            ? 'bg-[#2878ff] text-white'
            : 'hover:bg-slate-600/10'
        "
        @click.stop="selectFontSize(preset.value)"
      >
        {{ preset.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Props } from "./type.ts";
import { FONT_SIZE_PRESETS } from "@/constants/fontSize";

const props = withDefaults(defineProps<Props>(), {
  defaultColor: "#4a8cef",
  visible: false,
  colors: () => [
    "#101924",
    "#ff5a47",
    "#ffe600",
    "#25b870",
    "#4e95ff",
    "#8262ff",
    "#ff8a41",
    "#e0e3e7",

    "#98a5bb",
    "#ffb5a1",
    "#fff799",
    "#92ebb7",
    "#9bcaff",
    "#beb5ff",
    "#ffb579",
    "#ffffff"
  ],
});

const selectedColor = ref(props.defaultColor);
const show = ref(props.visible);
// 当前字号（本地维护，点击后立即高亮，无需等待父级重渲染）
const selectedFontSize = ref(props.fontSize);

const fontSizes = computed(() => props.fontSizes ?? FONT_SIZE_PRESETS);

function selectColor(color: string) {
  selectedColor.value = color;

  if (props.callback) {
    props.callback(selectedColor.value);
  }
}

function selectFontSize(size: number) {
  selectedFontSize.value = size;
  props.onFontSize?.(size);
}

watch(
  () => props.defaultColor,
  (newColor) => {
    selectedColor.value = newColor;
  }
);

watch(
  () => props.fontSize,
  (newSize) => {
    selectedFontSize.value = newSize;
  }
);

watch(
  () => props.visible,
  (newVal) => {
    show.value = newVal;
  }
);
</script>


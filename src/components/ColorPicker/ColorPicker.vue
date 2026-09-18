<template>
  <div
    class="fixed rounded-sm top-0 left-0 z-50"
    @click="show = !show"
    :style="`top:${props.pos.y}px;left:${props.pos.x}px`"
  >
    <div
      class="flex gap-x-1 px-1 py-2 items-center cursor-pointer hover:bg-slate-600/10"
    >
      <span
        class="current-color size-6 rounded-full"
        :style="{ backgroundColor: selectedColor || 'black' }"
      ></span>
      <span class="icon-[octicon--chevron-down-24]"></span>
    </div>
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
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { Props } from "./type.ts";

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

function selectColor(color: string) {
  selectedColor.value = color;

  if (props.callback) {
    props.callback(selectedColor.value);
  }
}

watch(
  () => props.defaultColor,
  (newColor) => {
    selectedColor.value = newColor;
  }
);

watch(
  () => props.visible,
  (newVal) => {
    show.value = newVal;
  }
);
</script>

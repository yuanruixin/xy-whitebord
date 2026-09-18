<template>
  <div
    v-if="style.visible"
    class="fixed left-1/2 -translate-x-1/2 top-14 z-40 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 max-w-[80vw] px-3 py-2 bg-white rounded-md shadow-lg text-sm text-slate-700 select-none"
  >
    <!-- 主色：填充 / 文本色 / 线条色 -->
    <label v-if="style.color !== null" class="flex items-center gap-x-1">
      <span>{{ style.strokeColor !== null ? "填充" : "颜色" }}</span>
      <input
        type="color"
        :value="style.color"
        class="size-6 p-0 border border-slate-300 rounded cursor-pointer bg-transparent"
        @change="onColor"
      />
    </label>
    <!-- 描边色（图形） -->
    <label v-if="style.strokeColor !== null" class="flex items-center gap-x-1">
      <span>描边</span>
      <input
        type="color"
        :value="style.strokeColor"
        class="size-6 p-0 border border-slate-300 rounded cursor-pointer bg-transparent"
        @change="onStrokeColor"
      />
    </label>
    <!-- 描边宽度 -->
    <label v-if="style.strokeWidth !== null" class="flex items-center gap-x-1">
      <span>宽度</span>
      <input
        type="range"
        min="0"
        max="20"
        step="1"
        :value="style.strokeWidth"
        class="w-20"
        @change="onStrokeWidth"
      />
      <span class="w-4 text-right">{{ style.strokeWidth }}</span>
    </label>
    <!-- 描边样式 -->
    <div v-if="style.dash !== null" class="flex items-center gap-x-1">
      <button
        v-for="d in dashOptions"
        :key="d.value"
        type="button"
        class="px-2 py-0.5 rounded cursor-pointer"
        :class="style.dash === d.value ? 'bg-[#2878ff] text-white' : 'hover:bg-slate-600/10'"
        @click="onDash(d.value)"
      >
        {{ d.label }}
      </button>
    </div>
    <!-- 透明度 -->
    <label class="flex items-center gap-x-1">
      <span>透明度</span>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        :value="style.opacity"
        class="w-20"
        @change="onOpacity"
      />
      <span class="w-9 text-right">{{ style.opacity }}%</span>
    </label>
    <!-- 文本 -->
    <template v-if="style.fontSize !== null">
      <span class="w-px h-5 bg-slate-300"></span>
      <div class="flex items-center gap-x-1">
        <button
          v-for="preset in fontSizes"
          :key="preset.label"
          type="button"
          class="w-7 h-6 rounded cursor-pointer"
          :class="style.fontSize === preset.value ? 'bg-[#2878ff] text-white' : 'hover:bg-slate-600/10'"
          @click="onFontSize(preset.value)"
        >
          {{ preset.label }}
        </button>
      </div>
      <button
        type="button"
        class="w-7 h-6 rounded font-bold cursor-pointer"
        :class="style.bold ? 'bg-[#2878ff] text-white' : 'hover:bg-slate-600/10'"
        @click="onBold(!style.bold)"
      >
        B
      </button>
      <button
        type="button"
        class="w-7 h-6 rounded italic cursor-pointer"
        :class="style.italic ? 'bg-[#2878ff] text-white' : 'hover:bg-slate-600/10'"
        @click="onItalic(!style.italic)"
      >
        I
      </button>
      <select
        :value="style.fontFamily"
        class="h-6 px-1 border border-slate-300 rounded bg-transparent cursor-pointer"
        @change="onFontFamily"
      >
        <option v-for="family in fontFamilies" :key="family" :value="family">
          {{ family }}
        </option>
      </select>
      <div class="flex items-center gap-x-1">
        <button
          v-for="align in alignOptions"
          :key="align"
          type="button"
          class="grid place-items-center size-6 rounded cursor-pointer"
          :class="style.align === align ? 'bg-[#2878ff] text-white' : 'hover:bg-slate-600/10'"
          @click="onAlign(align)"
        >
          <span :class="alignIcon[align]"></span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useRenderStore } from "@/store/render";
import { useSelectionStyle } from "@/store/selectionStyle";
import type { DashStyle, TextAlign } from "@/store/selectionStyle";
import { FONT_SIZE_PRESETS } from "@/constants/fontSize";

const { render } = useRenderStore();
const style = useSelectionStyle();

const fontSizes = FONT_SIZE_PRESETS;
const fontFamilies = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Courier New",
  "Comic Sans MS",
  "sans-serif",
  "serif",
  "monospace",
];
const dashOptions: { label: string; value: DashStyle }[] = [
  { label: "实线", value: "solid" },
  { label: "虚线", value: "dashed" },
  { label: "点线", value: "dotted" },
];
const alignOptions: TextAlign[] = ["left", "center", "right"];
const alignIcon: Record<TextAlign, string> = {
  left: "icon-[ph--text-align-left]",
  center: "icon-[ph--text-align-center]",
  right: "icon-[ph--text-align-right]",
};

function valueOf(e: Event): string {
  return (e.target as HTMLInputElement | HTMLSelectElement).value;
}

function onColor(e: Event) {
  render.value?.styleTool.setColor(valueOf(e));
}
function onStrokeColor(e: Event) {
  render.value?.styleTool.setStrokeColor(valueOf(e));
}
function onStrokeWidth(e: Event) {
  render.value?.styleTool.setStrokeWidth(Number(valueOf(e)));
}
function onDash(value: DashStyle) {
  render.value?.styleTool.setDash(value);
}
function onOpacity(e: Event) {
  render.value?.styleTool.setOpacity(Number(valueOf(e)));
}
function onFontSize(size: number) {
  render.value?.styleTool.setFontSize(size);
}
function onFontFamily(e: Event) {
  render.value?.styleTool.setFontFamily(valueOf(e));
}
function onBold(bold: boolean) {
  render.value?.styleTool.setBold(bold);
}
function onItalic(italic: boolean) {
  render.value?.styleTool.setItalic(italic);
}
function onAlign(align: TextAlign) {
  render.value?.styleTool.setAlign(align);
}
</script>

<style scoped></style>

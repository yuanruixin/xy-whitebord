<template>
  <Transition name="props-slide">
    <aside
      v-if="style.visible"
      class="fixed right-0 top-12 bottom-0 z-40 w-64 bg-white border-l border-slate-200 shadow-xl overflow-y-auto text-sm text-slate-700 select-none"
    >
      <div class="px-4 py-3 border-b border-slate-100">
        <h3 class="font-semibold text-slate-800">属性</h3>
      </div>

      <div class="p-4 flex flex-col gap-y-5">
        <!-- 主色：填充 / 文本色 / 线条色 -->
        <div v-if="style.color !== null" class="flex items-center justify-between">
          <span>{{ style.strokeColor !== null ? "填充" : "颜色" }}</span>
          <input
            type="color"
            :value="style.color"
            class="size-7 p-0 border border-slate-300 rounded cursor-pointer bg-transparent"
            @change="onColor"
          />
        </div>

        <!-- 描边（图形） -->
        <template v-if="style.strokeColor !== null">
          <div class="flex items-center justify-between">
            <span>描边颜色</span>
            <input
              type="color"
              :value="style.strokeColor"
              class="size-7 p-0 border border-slate-300 rounded cursor-pointer bg-transparent"
              @change="onStrokeColor"
            />
          </div>
          <div v-if="style.strokeWidth !== null" class="flex flex-col gap-y-1">
            <div class="flex items-center justify-between">
              <span>描边宽度</span>
              <span>{{ style.strokeWidth }}</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              :value="style.strokeWidth"
              class="w-full"
              @change="onStrokeWidth"
            />
          </div>
        </template>

        <!-- 线条宽度（线条/连接线/画笔） -->
        <div
          v-else-if="style.strokeWidth !== null"
          class="flex flex-col gap-y-1"
        >
          <div class="flex items-center justify-between">
            <span>线条宽度</span>
            <span>{{ style.strokeWidth }}</span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            step="1"
            :value="style.strokeWidth"
            class="w-full"
            @change="onStrokeWidth"
          />
        </div>

        <!-- 描边样式 -->
        <div v-if="style.dash !== null" class="flex flex-col gap-y-1">
          <span>描边样式</span>
          <div class="flex gap-x-1">
            <button
              v-for="d in dashOptions"
              :key="d.value"
              type="button"
              class="flex-1 px-2 py-1 rounded cursor-pointer"
              :class="
                style.dash === d.value
                  ? 'bg-[#2878ff] text-white'
                  : 'bg-slate-100 hover:bg-slate-200'
              "
              @click="onDash(d.value)"
            >
              {{ d.label }}
            </button>
          </div>
        </div>

        <!-- 透明度 -->
        <div class="flex flex-col gap-y-1">
          <div class="flex items-center justify-between">
            <span>透明度</span>
            <span>{{ style.opacity }}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            :value="style.opacity"
            class="w-full"
            @change="onOpacity"
          />
        </div>

        <!-- 文本 -->
        <template v-if="style.fontSize !== null">
          <div class="h-px bg-slate-100"></div>

          <div class="flex flex-col gap-y-1">
            <span>字号</span>
            <div class="flex gap-x-1">
              <button
                v-for="preset in fontSizes"
                :key="preset.label"
                type="button"
                class="flex-1 h-7 rounded cursor-pointer"
                :class="
                  style.fontSize === preset.value
                    ? 'bg-[#2878ff] text-white'
                    : 'bg-slate-100 hover:bg-slate-200'
                "
                @click="onFontSize(preset.value)"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <span>样式</span>
            <div class="flex gap-x-1">
              <button
                type="button"
                class="w-8 h-7 rounded font-bold cursor-pointer"
                :class="
                  style.bold
                    ? 'bg-[#2878ff] text-white'
                    : 'bg-slate-100 hover:bg-slate-200'
                "
                @click="onBold(!style.bold)"
              >
                B
              </button>
              <button
                type="button"
                class="w-8 h-7 rounded italic cursor-pointer"
                :class="
                  style.italic
                    ? 'bg-[#2878ff] text-white'
                    : 'bg-slate-100 hover:bg-slate-200'
                "
                @click="onItalic(!style.italic)"
              >
                I
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <span>字体</span>
            <select
              :value="style.fontFamily"
              class="h-7 px-1 border border-slate-300 rounded bg-transparent cursor-pointer"
              @change="onFontFamily"
            >
              <option v-for="family in fontFamilies" :key="family" :value="family">
                {{ family }}
              </option>
            </select>
          </div>

          <div class="flex items-center justify-between">
            <span>对齐</span>
            <div class="flex gap-x-1">
              <button
                v-for="align in alignOptions"
                :key="align"
                type="button"
                class="grid place-items-center size-7 rounded cursor-pointer"
                :class="
                  style.align === align
                    ? 'bg-[#2878ff] text-white'
                    : 'bg-slate-100 hover:bg-slate-200'
                "
                @click="onAlign(align)"
              >
                <span :class="alignIcon[align]"></span>
              </button>
            </div>
          </div>
        </template>
      </div>
    </aside>
  </Transition>
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

<style scoped>
.props-slide-enter-active,
.props-slide-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.props-slide-enter-from,
.props-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>

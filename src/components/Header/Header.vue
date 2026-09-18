<template>
  <header
    class="flex items-center h-12 border-b-[1px] border-slate-600/10 px-12 gap-2"
  >
    <!-- tools -->
    <div class="flex items-center justify-center ml-auto">
      <!-- export btn -->
      <div
        class="flex items-center justify-center p-[2px] hover:bg-slate-600/10 rounded-md cursor-pointer"
        @click="openExportModal"
        v-tooltip="'导出图片'"
      >
        <span
          class="icon-[ph--export-light] text-2xl font-black select-none"
        ></span>
      </div>
      <!-- import json btn -->
      <div
        class="flex items-center justify-center p-[2px] hover:bg-slate-600/10 rounded-md cursor-pointer"
        @click="onImportJson"
        v-tooltip="'导入 JSON'"
      >
        <span
          class="icon-[ph--upload-simple-light] text-2xl font-black select-none"
        ></span>
      </div>
      <!-- export json btn -->
      <div
        class="flex items-center justify-center p-[2px] hover:bg-slate-600/10 rounded-md cursor-pointer"
        @click="onExportJson"
        v-tooltip="'导出 JSON'"
      >
        <span
          class="icon-[ph--download-simple-light] text-2xl font-black select-none"
        ></span>
      </div>
    </div>
    <ZoomTool></ZoomTool>
  </header>
  <Modal v-model="showExportModal" >
    <div class="flex flex-col gap-y-5">
      <h3 class="text-lg leading-6 text-gray-900 font-bold">导出文件</h3>
      <ExportMenu @confirm="confirmExport"></ExportMenu>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import ZoomTool from "./ZoomTool.vue";
import { useRenderStore } from "@/store/render";
import {
  downloadFile,
  readFileAsText,
  selectSingleFile,
} from "@/utils/handleFile";

import ExportMenu from "./ExportMenu.vue";
import { ref } from "vue";
const { render } = useRenderStore();

const showExportModal = ref(false);
function openExportModal() {
  showExportModal.value = true;
}

// 导出为 JSON 文件
function onExportJson() {
  if (!render.value) return;
  downloadFile(render.value.importExportTool.save(), { fileName: "whiteboard" });
}

// 从 JSON 文件导入（替换当前画面）
async function onImportJson() {
  if (!render.value) return;
  const file = await selectSingleFile();
  if (!file) return;
  const text = await readFileAsText(file);
  await render.value.importExportTool.restore(text, true);
  render.value.historyTool.reset();
}

interface ExportImageConfig {
  type: "jpeg" | "png";
  bg: "grid" | "transparent" | "white";
}
function confirmExport(config: ExportImageConfig): void {
  showExportModal.value = false;
  saveAsImage(config);
  function saveAsImage(config: ExportImageConfig) {
    if (render.value) {
      const url = render.value.importExportTool.getExportImageBase64({
        type: config.type ?? "jpeg",
        bg: config.bg ?? "grid",
        quality: 1,
      });
      downloadFile(url);
    }
  }
}
</script>

<style scoped></style>

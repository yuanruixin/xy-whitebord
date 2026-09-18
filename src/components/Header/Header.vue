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
      >
        <span
          class="icon-[ph--export-light] text-2xl font-black select-none"
        ></span>
      </div>
      <!-- <div class="flex items-center justify-center p-[2px] hover:bg-slate-600/10 rounded-md cursor-pointer"
        @click="saveAsJson"
      >
        <span
          class="text-2xl font-black select-none"
        >导出JSON</span>
      </div>
      <div class="flex items-center justify-center p-[2px] hover:bg-slate-600/10 rounded-md cursor-pointer"
        @click="onImport"
      >
        <span
          class="text-2xl font-black select-none"
        >导入</span> -->
      <!-- </div> -->
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
import { downloadFile } from "@/utils/handleFile";

import ExportMenu from "./ExportMenu.vue";
import { ref } from "vue";
const { render } = useRenderStore();

const showExportModal = ref(false);
function openExportModal() {
  showExportModal.value = true;
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

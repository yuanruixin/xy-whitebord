<template>
  <!-- 右上角悬浮菜单 -->
  <div class="fixed top-3 right-3 z-50">
    <Menu as="div" class="relative">
      <MenuButton
        class="flex items-center justify-center p-1 rounded-md bg-white shadow-sm ring-1 ring-black/5 hover:bg-slate-100 cursor-pointer"
        v-tooltip="'菜单'"
      >
        <span class="icon-[mdi--menu] text-2xl select-none"></span>
      </MenuButton>

      <MenuItems
        class="absolute right-0 mt-1 w-44 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none py-1 z-50"
      >
        <MenuItem
          v-for="item in menuItems"
          :key="item.label"
          v-slot="{ active }"
        >
          <button
            type="button"
            class="flex items-center gap-x-3 w-full px-3 py-2 text-sm text-slate-700"
            :class="active ? 'bg-slate-100' : ''"
            @click="item.action()"
          >
            <span :class="item.icon" class="text-lg"></span>
            <span>{{ item.label }}</span>
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  </div>

  <Modal v-model="showExportModal">
    <div class="flex flex-col gap-y-5">
      <h3 class="text-lg leading-6 text-gray-900 font-bold">导出文件</h3>
      <ExportMenu @confirm="confirmExport"></ExportMenu>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { useRenderStore } from "@/store/render";
import {
  downloadFile,
  readFileAsText,
  selectSingleFile,
} from "@/utils/handleFile";

import ExportMenu from "@/components/Header/ExportMenu.vue";
import { ref } from "vue";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import { useAIStore } from "@/store/ai";
const { render } = useRenderStore();
const { toggleDialog: toggleAIDialog } = useAIStore();

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

// 菜单项（图标 + 文字）
const menuItems = [
  {
    label: "AI 生成图形",
    icon: "icon-[mdi--robot-outline]",
    action: toggleAIDialog,
  },
  {
    label: "导出图片",
    icon: "icon-[ph--export-light]",
    action: openExportModal,
  },
  {
    label: "导出 JSON",
    icon: "icon-[ph--download-simple-light]",
    action: onExportJson,
  },
  {
    label: "导入 JSON",
    icon: "icon-[ph--upload-simple-light]",
    action: onImportJson,
  },
];
</script>

<style scoped></style>

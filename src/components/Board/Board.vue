<template>
  <div class="h-full">
    <tool-bar class="z-10"></tool-bar>
    <div class="h-full bg-repeat" id="canvasBox" ref="canvasBox"></div>

    <!-- 左下角：撤销/重做 + 缩放 -->
    <div class="fixed left-3 bottom-6 z-10 flex items-center gap-x-2">
      <HistoryButtons></HistoryButtons>
      <ZoomTool></ZoomTool>
    </div>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from "vue";
import ToolBar from "@/components/ToolBar/ToolBar.vue";
import ZoomTool from "@/components/Header/ZoomTool.vue";
import HistoryButtons from "./HistoryButtons.vue";
import { useRender } from "./useRender";

const canvasBox = shallowRef<HTMLDivElement | null>(null);

// 初始化画板
useRender(canvasBox);
</script>

<style scoped></style>

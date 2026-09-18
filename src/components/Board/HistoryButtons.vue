<template>
  <div
    class="flex items-center h-min rounded-md border-2 border-slate-600/10 bg-white shadow-sm overflow-hidden select-none"
  >
    <button
      type="button"
      class="grid place-items-center size-7 hover:bg-slate-600/10 disabled:opacity-30 disabled:cursor-not-allowed"
      :disabled="history.canUndo === false"
      @click="undo"
      v-tooltip="'撤销'"
    >
      <span class="icon-[ph--arrow-counter-clockwise] text-lg"></span>
    </button>
    <div class="w-px h-4 bg-slate-300/50"></div>
    <button
      type="button"
      class="grid place-items-center size-7 hover:bg-slate-600/10 disabled:opacity-30 disabled:cursor-not-allowed"
      :disabled="history.canRedo === false"
      @click="redo"
      v-tooltip="'重做'"
    >
      <span class="icon-[ph--arrow-clockwise] text-lg"></span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useRenderStore } from "@/store/render";
import { useHistoryState } from "@/store/history";

const { render } = useRenderStore();
const history = useHistoryState();

function undo() {
  render.value?.historyTool.prevHistory();
}
function redo() {
  render.value?.historyTool.nextHistory();
}
</script>

<style scoped></style>

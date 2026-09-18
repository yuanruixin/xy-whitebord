<template>
  <div
    v-if="confirmRequest"
    class="absolute inset-0 z-10 flex items-center justify-center bg-black/30 p-4"
  >
    <div class="w-full rounded-xl bg-white p-4 shadow-xl">
      <div class="flex items-center gap-x-2 text-slate-800">
        <span class="icon-[mdi--alert-outline] text-lg text-amber-500"></span>
        <h4 class="font-semibold">确认危险操作</h4>
      </div>
      <p class="mt-2 text-sm text-slate-600">
        AI 请求执行「{{ confirmSummary }}」，是否继续？
      </p>
      <ul
        v-if="confirmTargets.length"
        class="mt-2 max-h-40 overflow-y-auto rounded-lg bg-slate-50 p-2 text-xs text-slate-500"
      >
        <li
          v-for="target in confirmTargets"
          :key="target.id"
          class="truncate py-0.5"
        >
          • {{ target.label || target.type }}
        </li>
      </ul>
      <div class="mt-4 flex justify-end gap-x-2">
        <button
          type="button"
          class="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          @click="resolveConfirm(false)"
        >
          取消
        </button>
        <button
          type="button"
          class="rounded-md bg-red-500 px-3 py-1.5 text-sm text-white hover:bg-red-600"
          @click="resolveConfirm(true)"
        >
          确认执行
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDangerConfirm } from "./composables/useDangerConfirm";

const { confirmRequest, confirmSummary, confirmTargets, resolveConfirm } =
  useDangerConfirm();
</script>

<template>
  <div class="border-t border-slate-100 p-3">
    <div
      v-if="!hasApiKey"
      class="mb-2 flex items-center gap-x-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600"
    >
      <span class="icon-[mdi--alert-circle-outline] text-base"></span>
      <span>尚未配置 API Key</span>
      <button
        type="button"
        class="ml-auto font-medium text-primary hover:underline"
        @click="toggleSettings"
      >
        去配置
      </button>
    </div>
    <div
      v-else-if="!isApiKeyConfirmed"
      class="mb-2 flex items-center gap-x-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500"
    >
      <span class="icon-[mdi--circle-medium] text-base"></span>
      <span>API Key 未确认</span>
      <button
        type="button"
        class="ml-auto font-medium text-primary hover:underline"
        @click="showSettings = true"
      >
        去设置
      </button>
    </div>

    <!-- 引用选中图形 -->
    <div
      v-if="selection.length > 0 || pinnedSelection.length > 0"
      class="mb-2 flex flex-wrap items-center gap-1.5"
    >
      <button
        v-if="selection.length > 0"
        type="button"
        class="flex items-center gap-x-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
        @click="pinSelection"
      >
        <span class="icon-[mdi--plus-circle-outline]"></span>
        引用选中图形 ({{ selection.length }})
      </button>
      <template v-if="pinnedSelection.length > 0">
        <span
          class="flex items-center gap-x-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
        >
          已引用 {{ pinnedSelection.length }} 个图形
          <button
            type="button"
            class="text-primary/60 hover:text-red-500"
            @click="clearPinnedSelection"
          >
            <span class="icon-[mdi--close] text-xs"></span>
          </button>
        </span>
      </template>
    </div>

    <div class="flex items-end gap-x-2">
      <textarea
        ref="inputRef"
        v-model="input"
        rows="3"
        placeholder="描述你想要的图形，Enter 发送，Shift+Enter 换行"
        class="max-h-60 min-h-[4.5rem] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-primary"
        @input="autoGrow"
        @keydown="onKeydown"
      ></textarea>
      <button
        type="button"
        class="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-white disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!canSend"
        @click="loading ? onStop() : send()"
      >
        <span v-if="loading" class="icon-[mdi--stop] text-lg"></span>
        <span v-else class="icon-[mdi--send] text-lg"></span>
      </button>
    </div>
    <p v-if="error" class="mt-2 text-xs text-red-500">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { useAIChat } from "./composables/useAIChat";

const {
  hasApiKey,
  isApiKeyConfirmed,
  showSettings,
  selection,
  pinnedSelection,
  pinSelection,
  clearPinnedSelection,
  input,
  inputRef,
  autoGrow,
  onKeydown,
  canSend,
  loading,
  onStop,
  send,
  error,
  toggleSettings,
} = useAIChat();
</script>

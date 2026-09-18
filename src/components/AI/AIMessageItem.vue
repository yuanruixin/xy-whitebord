<template>
  <!-- 用户 -->
  <div
    v-if="message.role === 'user'"
    class="group flex flex-col items-end gap-y-1"
  >
    <template v-if="editingId === message.id">
      <textarea
        v-model="editingText"
        rows="2"
        class="w-full max-w-[85%] resize-none rounded-2xl rounded-br-md border border-primary/40 px-3 py-2 text-sm leading-6 outline-none focus:border-primary"
        @keydown.enter.exact.prevent="saveEdit(message)"
        @keydown.esc.prevent="cancelEdit"
      ></textarea>
      <div class="flex items-center gap-x-2">
        <button
          type="button"
          class="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
          @click="cancelEdit"
        >
          取消
        </button>
        <button
          type="button"
          class="rounded-md bg-primary px-2.5 py-1 text-xs text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!editingText.trim()"
          @click="saveEdit(message)"
        >
          保存并重新发送
        </button>
      </div>
    </template>
    <template v-else>
      <div
        class="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-3 py-2 text-sm text-white"
      >
        {{ message.text }}
      </div>
      <div
        class="flex items-center gap-x-0.5 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <button
          type="button"
          v-tooltip="'复制'"
          class="grid size-6 place-items-center rounded hover:bg-slate-100 hover:text-slate-600"
          @click="copyMessage(message)"
        >
          <span
            :class="
              copiedId === message.id
                ? 'icon-[mdi--check] text-green-500'
                : 'icon-[mdi--content-copy]'
            "
          ></span>
        </button>
        <button
          type="button"
          v-tooltip="'编辑并重新发送'"
          class="grid size-6 place-items-center rounded hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="loading"
          @click="startEdit(message)"
        >
          <span class="icon-[mdi--pencil-outline]"></span>
        </button>
      </div>
    </template>
  </div>

  <!-- 助手 -->
  <div v-else class="group flex w-full flex-col items-start gap-y-2">
    <div
      v-if="message.reasoning"
      class="max-h-40 w-full overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-amber-100 bg-amber-50 p-2 text-xs leading-5 text-amber-700"
    >
      {{ message.reasoning }}
    </div>

    <div class="flex items-start gap-x-2 text-sm text-slate-700">
      <span
        v-if="message.streaming"
        class="icon-[mdi--loading] mt-0.5 animate-spin text-primary"
      ></span>
      <span v-if="message.streaming" class="text-slate-400">
        {{ statusText }}
      </span>
      <span v-else class="whitespace-pre-wrap break-words leading-6">
        {{ message.text }}
      </span>
    </div>

    <div v-if="message.tools?.length" class="flex flex-wrap gap-1.5">
      <span
        v-for="(tool, index) in message.tools"
        :key="index"
        class="flex items-center gap-x-0.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500"
      >
        <span class="icon-[mdi--check] text-green-500"></span>
        {{ tool }}
      </span>
    </div>

    <button
      v-if="message.kind === 'scene' && !message.streaming"
      type="button"
      class="flex items-center gap-x-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100"
      @click="reimport(message)"
    >
      <span class="icon-[mdi--import]"></span>
      重新导入画布
    </button>

    <div
      v-if="!message.streaming"
      class="flex items-center gap-x-0.5 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100"
    >
      <button
        type="button"
        v-tooltip="'复制'"
        class="grid size-6 place-items-center rounded hover:bg-slate-100 hover:text-slate-600"
        @click="copyMessage(message)"
      >
        <span
          :class="
            copiedId === message.id
              ? 'icon-[mdi--check] text-green-500'
              : 'icon-[mdi--content-copy]'
          "
        ></span>
      </button>
      <button
        v-if="lastMessageId === message.id"
        type="button"
        v-tooltip="'重试'"
        class="grid size-6 place-items-center rounded hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="loading"
        @click="retryMessage(message)"
      >
        <span class="icon-[mdi--refresh]"></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AIChatMessage } from "@/store/aiConversations";
import { useAIChat } from "./composables/useAIChat";

defineProps<{
  message: AIChatMessage;
  lastMessageId: string;
  loading: boolean;
}>();

const {
  editingId,
  editingText,
  copiedId,
  statusText,
  copyMessage,
  startEdit,
  cancelEdit,
  saveEdit,
  retryMessage,
  reimport,
} = useAIChat();
</script>

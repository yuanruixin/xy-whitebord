<template>
  <div class="flex-1 overflow-y-auto p-2">
    <div
      v-if="conversations.length === 0"
      class="py-10 text-center text-sm text-slate-400"
    >
      暂无历史对话
    </div>
    <div v-else class="flex flex-col gap-y-1">
      <div
        v-for="conversation in conversations"
        :key="conversation.id"
        class="group flex cursor-pointer items-start gap-x-2 rounded-md px-3 py-2 hover:bg-slate-50"
        :class="conversation.id === activeId ? 'bg-slate-100' : ''"
        @click="openConversation(conversation)"
      >
        <div class="min-w-0 flex-1 text-left">
          <div class="truncate text-sm text-slate-700">
            {{ conversation.title }}
          </div>
          <div class="mt-0.5 text-xs text-slate-400">
            {{ conversation.messages.length }} 条消息 ·
            {{ formatTime(conversation.updatedAt) }}
          </div>
        </div>
        <button
          type="button"
          class="shrink-0 rounded p-1 text-slate-300 hover:bg-slate-200 hover:text-red-500"
          v-tooltip="'删除'"
          @click.stop="removeConversation(conversation.id)"
        >
          <span class="icon-[mdi--trash-can-outline]"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAIChat } from "./composables/useAIChat";

const { conversations, activeId, openConversation, removeConversation, formatTime } =
  useAIChat();
</script>

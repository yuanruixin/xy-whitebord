<template>
  <Transition name="ai-slide">
    <aside
      v-if="showDialog"
      class="fixed right-0 top-0 bottom-0 z-40 flex w-[24rem] flex-col border-l border-slate-200 bg-white text-left shadow-xl"
      @wheel.stop
    >
      <!-- 头部（右侧留出悬浮菜单的位置） -->
      <div
        class="flex items-center gap-x-2 border-b border-slate-100 py-3 pl-4 pr-12"
      >
        <span class="icon-[mdi--robot-outline] text-xl text-primary"></span>
        <h3 class="font-semibold text-slate-800">AI 绘图</h3>
        <div class="ml-auto flex items-center gap-x-1">
          <button
            type="button"
            class="grid size-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
            v-tooltip="'新对话'"
            @click="startNewConversation"
          >
            <span class="icon-[mdi--plus]"></span>
          </button>
          <button
            type="button"
            class="grid size-7 place-items-center rounded-md hover:bg-slate-100"
            :class="showHistory ? 'bg-slate-100 text-primary' : 'text-slate-500'"
            v-tooltip="'历史对话'"
            @click="toggleHistory"
          >
            <span class="icon-[mdi--history]"></span>
          </button>
          <button
            type="button"
            class="grid size-7 place-items-center rounded-md hover:bg-slate-100"
            :class="showSettings ? 'bg-slate-100 text-primary' : 'text-slate-500'"
            v-tooltip="'API 设置'"
            @click="toggleSettings"
          >
            <span class="icon-[mdi--cog-outline]"></span>
          </button>
          <button
            type="button"
            class="grid size-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
            v-tooltip="'收起'"
            @click="showDialog = false"
          >
            <span class="icon-[mdi--close]"></span>
          </button>
        </div>
      </div>

      <!-- 设置 -->
      <AISettingsPanel v-if="showSettings" />

      <!-- 历史对话 -->
      <AIHistoryPanel v-if="showHistory" />

      <!-- 对话 -->
      <template v-else>
        <div
          ref="messagesRef"
          class="flex flex-1 flex-col gap-y-4 overflow-y-auto px-4 py-4"
        >
          <div
            v-if="messages.length === 0"
            class="mt-8 flex flex-col items-center gap-y-3 text-center text-sm text-slate-400"
          >
            <span
              class="icon-[mdi--robot-outline] text-3xl text-slate-300"
            ></span>
            <p>描述你想要的图形，我会先确认需求，再绘制到画布。</p>
            <div class="flex flex-wrap justify-center gap-2 pt-1">
              <button
                v-for="example in examples"
                :key="example"
                type="button"
                class="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-slate-200"
                @click="useExample(example)"
              >
                {{ example }}
              </button>
            </div>
          </div>

          <AIMessageItem
            v-for="message in messages"
            :key="message.id"
            :message="message"
            :last-message-id="lastMessageId"
            :loading="loading"
          />
        </div>

        <!-- 输入区 -->
        <AIChatComposer />
      </template>

      <!-- 危险操作确认 -->
      <AIDangerConfirmDialog />
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { useAIChat } from "./composables/useAIChat";
import AISettingsPanel from "./AISettingsPanel.vue";
import AIHistoryPanel from "./AIHistoryPanel.vue";
import AIChatComposer from "./AIChatComposer.vue";
import AIMessageItem from "./AIMessageItem.vue";
import AIDangerConfirmDialog from "./AIDangerConfirmDialog.vue";

const {
  showDialog,
  showSettings,
  showHistory,
  messages,
  lastMessageId,
  loading,
  examples,
  useExample,
  toggleSettings,
  toggleHistory,
  startNewConversation,
  onStop,
} = useAIChat();

const messagesRef = ref<HTMLDivElement | null>(null);

// 新消息 / 流式增长时滚动到底部
watch(
  () => {
    const last = messages.value[messages.value.length - 1];
    return last
      ? `${messages.value.length}:${last.text.length}:${last.reasoning?.length ?? 0}`
      : "0";
  },
  async () => {
    await nextTick();
    const el = messagesRef.value;
    if (el) el.scrollTop = el.scrollHeight;
  }
);

// 关闭侧边栏时中断生成并取消待确认操作
watch(showDialog, (open) => {
  if (!open && loading.value) onStop();
});
</script>

<style scoped>
.ai-slide-enter-active,
.ai-slide-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.ai-slide-enter-from,
.ai-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>

import { ref } from "vue";
import type { AIChatMessage } from "@/store/aiConversations";

// 正在编辑的消息 id 与编辑内容
const editingId = ref<string | null>(null);
const editingText = ref("");
// 最近一次复制的消息 id（用于短暂显示对勾）
const copiedId = ref<string | null>(null);
let copiedTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 消息交互：复制 / 进入编辑 / 取消编辑。
 */
export function useMessageActions() {
  function copyMessage(message: AIChatMessage) {
    if (!message.text) return;
    navigator.clipboard
      ?.writeText(message.text)
      .then(() => {
        copiedId.value = message.id;
        if (copiedTimer) clearTimeout(copiedTimer);
        copiedTimer = setTimeout(() => {
          copiedId.value = null;
        }, 1500);
      })
      .catch(() => {
        // 剪贴板不可用时忽略
      });
  }

  function startEdit(message: AIChatMessage) {
    editingId.value = message.id;
    editingText.value = message.text;
  }

  function cancelEdit() {
    editingId.value = null;
    editingText.value = "";
  }

  function resetEdit() {
    editingId.value = null;
    editingText.value = "";
  }

  return {
    editingId,
    editingText,
    copiedId,
    copyMessage,
    startEdit,
    cancelEdit,
    resetEdit,
  };
}

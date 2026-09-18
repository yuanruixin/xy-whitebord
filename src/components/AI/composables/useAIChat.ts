import { ref } from "vue";
import { useRenderStore } from "@/store/render";
import { useAIStore } from "@/store/ai";
import {
  useAIConversations,
  type AIConversation,
  type AIChatMessage,
} from "@/store/aiConversations";
import { parseScene } from "@/utils/ai";
import { EXAMPLE_PROMPTS, formatTime } from "../aiChatHelpers";
import { useAIKeySettings } from "./useAIKeySettings";
import { useSelectionReference } from "./useSelectionReference";
import { useDangerConfirm } from "./useDangerConfirm";
import { useMessageActions } from "./useMessageActions";
import { useCanvasAgent } from "./useCanvasAgent";

// 当前是否展示历史面板
const showHistory = ref(false);

/**
 * AI 侧边栏总入口：聚合设置、选区引用、危险确认、消息交互与画布 Agent，
 * 并管理会话导航（历史 / 新建 / 打开 / 删除 / 重新导入）。
 */
export function useAIChat() {
  const keySettings = useAIKeySettings();
  const selectionRef = useSelectionReference();
  const dangerConfirm = useDangerConfirm();
  const messageActions = useMessageActions();
  const agent = useCanvasAgent();

  const { render } = useRenderStore();
  const { showDialog } = useAIStore();
  const {
    conversations,
    activeId,
    activeConversation,
    newConversation,
    selectConversation,
    deleteConversation,
  } = useAIConversations();

  function toggleSettings() {
    keySettings.showSettings.value = !keySettings.showSettings.value;
    if (keySettings.showSettings.value) showHistory.value = false;
  }

  function toggleHistory() {
    showHistory.value = !showHistory.value;
    if (showHistory.value) keySettings.showSettings.value = false;
  }

  function startNewConversation() {
    agent.resetSession();
    selectionRef.clearPinnedSelection();
    newConversation();
    showHistory.value = false;
  }

  function openConversation(conversation: AIConversation) {
    if (agent.loading.value) return;
    selectConversation(conversation.id);
    agent.error.value = "";
    showHistory.value = false;
  }

  function removeConversation(id: string) {
    deleteConversation(id);
  }

  function reimport(message: AIChatMessage) {
    if (!message.raw || !render.value) return;
    try {
      const scene = parseScene(message.raw);
      render.value.canvasTool.createNodes({
        nodes: scene.nodes,
        edges: scene.edges,
      });
      agent.error.value = "";
    } catch (e) {
      agent.error.value = e instanceof Error ? e.message : String(e);
    }
  }

  return {
    ...keySettings,
    ...selectionRef,
    ...dangerConfirm,
    ...messageActions,
    ...agent,
    showDialog,
    showHistory,
    conversations,
    activeId,
    activeConversation,
    examples: EXAMPLE_PROMPTS,
    formatTime,
    toggleSettings,
    toggleHistory,
    startNewConversation,
    openConversation,
    removeConversation,
    reimport,
  };
}

import { computed, nextTick, ref } from "vue";
import { useRenderStore } from "@/store/render";
import {
  useAIConversations,
  type AIConversation,
  type AIChatMessage,
} from "@/store/aiConversations";
import {
  runCanvasAgent,
  tryParseScene,
  type AIChatTurn,
  type AIStatus,
} from "@/utils/ai";
import { STATUS_TEXT, describeToolCall } from "../aiChatHelpers";
import { useAIKeySettings } from "./useAIKeySettings";
import { useSelectionReference } from "./useSelectionReference";
import { useDangerConfirm } from "./useDangerConfirm";
import { useMessageActions } from "./useMessageActions";

// 会话运行状态（模块级共享）
const loading = ref(false);
const status = ref<AIStatus>("idle");
const error = ref("");
const input = ref("");
const inputRef = ref<HTMLTextAreaElement | null>(null);
let controller: AbortController | null = null;

/**
 * 画布 Agent 会话：发送、编辑后重发、重试，以及流式渲染与状态管理。
 */
export function useCanvasAgent() {
  const { render } = useRenderStore();
  const { config, hasApiKey, isApiKeyConfirmed, showSettings, focusApiKeyInput } =
    useAIKeySettings();
  const { buildSelectionContext, clearPinnedSelection } =
    useSelectionReference();
  const { requestConfirm, resolveConfirm } = useDangerConfirm();
  const { resetEdit, editingText } = useMessageActions();
  const { conversations, activeConversation, createConversation, appendMessage } =
    useAIConversations();

  const messages = computed(() => activeConversation.value?.messages ?? []);
  const lastMessageId = computed(
    () => messages.value[messages.value.length - 1]?.id ?? ""
  );
  const statusText = computed(() => STATUS_TEXT[status.value]);
  const canSend = computed(
    () => loading.value || input.value.trim().length > 0
  );

  // 校验 API Key 是否可用
  async function ensureReady(): Promise<boolean> {
    if (!hasApiKey.value) {
      error.value = "请先填写 API Key";
      showSettings.value = true;
      await nextTick();
      focusApiKeyInput();
      return false;
    }
    if (!isApiKeyConfirmed.value) {
      error.value = "请先确认 API Key";
      showSettings.value = true;
      return false;
    }
    return true;
  }

  function removeMessage(conversation: AIConversation, id: string) {
    const index = conversation.messages.findIndex((item) => item.id === id);
    if (index !== -1) conversation.messages.splice(index, 1);
  }

  // 追加助手消息并发起一次 AI 请求（流式渲染）
  async function runAgent(conversation: AIConversation) {
    const placeholder = appendMessage(conversation, {
      role: "assistant",
      text: "",
      streaming: true,
    });

    // 取响应式代理，保证流式输出与工具执行过程实时渲染
    const conv =
      conversations.value.find((item) => item.id === conversation.id) ??
      conversation;
    const assistant =
      conv.messages.find((item) => item.id === placeholder.id) ?? placeholder;

    if (!render.value) {
      error.value = "画布尚未初始化";
      assistant.streaming = false;
      removeMessage(conv, assistant.id);
      return;
    }
    // 画布能力端口：AI 模块通过它操作画布
    const executor = render.value.canvasTool;

    loading.value = true;
    status.value = "connecting";
    controller = new AbortController();
    const currentController = controller;

    // 仅取最近若干轮，控制上下文长度
    const turns: AIChatTurn[] = conv.messages
      .filter((message) => !message.streaming)
      .slice(-12)
      .map((message) => ({
        role: message.role,
        content:
          message.role === "assistant"
            ? message.raw ?? message.text
            : message.text,
      }));

    let contentText = "";
    let reasoningText = "";
    let lastFlush = 0;
    const flushReasoning = (force = false) => {
      const now = performance.now();
      if (!force && now - lastFlush < 80) return;
      lastFlush = now;
      assistant.reasoning = reasoningText;
    };

    try {
      const result = await runCanvasAgent(
        turns,
        { ...config },
        executor,
        {
          signal: controller.signal,
          onStatus: (next) => (status.value = next),
          onContent: (_delta, full) => {
            contentText = full;
            assistant.text = full;
          },
          onReasoning: (_delta, full) => {
            reasoningText = full;
            flushReasoning();
          },
          onToolCall: (record) => {
            assistant.tools = [
              ...(assistant.tools ?? []),
              describeToolCall(record),
            ];
          },
        },
        {
          canvasContext: executor.describeCanvas(),
          selectionContext: buildSelectionContext(),
          onConfirm: requestConfirm,
        }
      );

      if (controller !== currentController) return;

      assistant.streaming = false;
      if (reasoningText) assistant.reasoning = reasoningText;

      if (result.toolCalls.length > 0) {
        // 已通过工具操作画布
        assistant.kind = "action";
        assistant.text =
          result.text || `已完成 ${result.toolCalls.length} 项画布操作`;
      } else {
        // 兼容未走工具调用、直接返回场景 JSON 的模型
        const fallback = tryParseScene(result.text || contentText);
        if (fallback) {
          executor.createNodes({
            nodes: fallback.nodes,
            edges: fallback.edges,
          });
          assistant.kind = "scene";
          assistant.raw = result.text || contentText;
          assistant.nodeCount = fallback.nodes.length;
          assistant.text = `已生成 ${fallback.nodes.length} 个节点并导入画布`;
        } else {
          assistant.kind = "ask";
          assistant.text = result.text || "（无回复）";
        }
      }
      clearPinnedSelection();
      conv.updatedAt = Date.now();
    } catch (e) {
      if (controller !== currentController) return;
      assistant.streaming = false;
      if ((e as Error)?.name === "AbortError") {
        error.value = "已停止";
        if (!reasoningText && !contentText) {
          removeMessage(conv, assistant.id);
        } else {
          assistant.text = "（已停止）";
        }
      } else {
        error.value = e instanceof Error ? e.message : String(e);
        removeMessage(conv, assistant.id);
      }
    } finally {
      if (controller === currentController) {
        loading.value = false;
        controller = null;
        status.value = "idle";
      }
    }
  }

  async function send() {
    if (loading.value) return;
    const text = input.value.trim();
    if (!text) return;
    if (!(await ensureReady())) return;

    error.value = "";
    input.value = "";
    await nextTick();
    autoGrow();

    const conversation = activeConversation.value ?? createConversation();
    appendMessage(conversation, { role: "user", text });
    await runAgent(conversation);
  }

  // 编辑用户消息后，从该条重新发送（丢弃其后的回复并重新生成）
  async function saveEdit(message: AIChatMessage) {
    if (loading.value) return;
    const text = editingText.value.trim();
    if (!text) return;

    const conversation = activeConversation.value;
    if (!conversation) return;

    const index = conversation.messages.findIndex(
      (item) => item.id === message.id
    );
    if (index === -1) return;

    if (!(await ensureReady())) return;

    error.value = "";
    conversation.messages[index].text = text;
    // 丢弃该消息之后的回复，重新生成
    conversation.messages.splice(index + 1);
    conversation.updatedAt = Date.now();
    resetEdit();

    await runAgent(conversation);
  }

  // 重试最后一条模型回复：丢弃当前回复并重新生成
  async function retryMessage(message: AIChatMessage) {
    if (loading.value) return;
    const conversation = activeConversation.value;
    if (!conversation) return;

    const index = conversation.messages.findIndex(
      (item) => item.id === message.id
    );
    // 仅允许重试最后一条回复，避免误删后续对话
    if (index === -1 || index !== conversation.messages.length - 1) return;
    if (!conversation.messages.some((item) => item.role === "user")) return;

    if (!(await ensureReady())) return;

    error.value = "";
    conversation.messages.splice(index);
    conversation.updatedAt = Date.now();

    await runAgent(conversation);
  }

  function onStop() {
    resolveConfirm(false);
    controller?.abort();
  }

  function autoGrow() {
    const el = inputRef.value;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function useExample(example: string) {
    input.value = example;
    autoGrow();
    inputRef.value?.focus();
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== "Enter" || event.shiftKey) return;
    // 输入法组词中不发送
    if (event.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    if (!loading.value) void send();
  }

  // 新建 / 关闭会话时重置运行状态
  function resetSession() {
    resolveConfirm(false);
    controller?.abort();
    controller = null;
    loading.value = false;
    status.value = "idle";
    input.value = "";
    error.value = "";
    resetEdit();
  }

  return {
    loading,
    status,
    error,
    statusText,
    messages,
    lastMessageId,
    input,
    inputRef,
    canSend,
    send,
    saveEdit,
    retryMessage,
    onStop,
    onKeydown,
    autoGrow,
    useExample,
    ensureReady,
    resetSession,
  };
}

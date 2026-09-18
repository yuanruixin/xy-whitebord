import { computed, ref, watch } from "vue";
import { nanoid } from "nanoid";

export type AIChatRole = "user" | "assistant";
export type AIChatKind = "ask" | "scene" | "action";

export interface AIChatMessage {
  id: string;
  role: AIChatRole;
  // 展示文本（用户输入 / 助手的提问或结果说明）
  text: string;
  // 助手的原始输出（JSON），用于重放与重新导入
  raw?: string;
  // 助手推理过程
  reasoning?: string;
  kind?: AIChatKind;
  nodeCount?: number;
  // 本轮执行过的画布操作摘要
  tools?: string[];
  // 正在流式输出
  streaming?: boolean;
  createdAt: number;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "xy-whiteboard:ai-conversations";
const MAX = 50;
const DEFAULT_TITLE = "新对话";

function makeTitle(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return DEFAULT_TITLE;
  return clean.length > 18 ? `${clean.slice(0, 18)}…` : clean;
}

// 兼容旧版单次生成结构
interface LegacyConversation {
  id: string;
  title?: string;
  prompt?: string;
  output?: string;
  reasoning?: string;
  nodeCount?: number;
  createdAt: number;
  updatedAt: number;
}

function migrate(raw: unknown): AIConversation[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item): AIConversation | null => {
      if (!item || typeof item !== "object") return null;
      const legacy = item as LegacyConversation & Partial<AIConversation>;

      // 已是新结构
      if (Array.isArray(legacy.messages)) {
        return legacy as AIConversation;
      }

      // 旧结构：prompt + output -> user/assistant 两条消息
      const messages: AIChatMessage[] = [];
      if (typeof legacy.prompt === "string" && legacy.prompt.trim()) {
        messages.push({
          id: nanoid(),
          role: "user",
          text: legacy.prompt,
          createdAt: legacy.createdAt ?? Date.now(),
        });
      }
      if (typeof legacy.output === "string" && legacy.output.trim()) {
        messages.push({
          id: nanoid(),
          role: "assistant",
          text: legacy.nodeCount
            ? `已生成 ${legacy.nodeCount} 个节点并导入画布`
            : "已生成图形",
          raw: legacy.output,
          reasoning: legacy.reasoning,
          kind: "scene",
          nodeCount: legacy.nodeCount ?? 0,
          createdAt: legacy.updatedAt ?? Date.now(),
        });
      }
      if (messages.length === 0) return null;

      return {
        id: legacy.id ?? nanoid(),
        title: legacy.title ?? makeTitle(messages[0].text),
        messages,
        createdAt: legacy.createdAt ?? Date.now(),
        updatedAt: legacy.updatedAt ?? Date.now(),
      };
    })
    .filter((item): item is AIConversation => item !== null);
}

function load(): AIConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return migrate(JSON.parse(raw));
  } catch {
    return [];
  }
}

const conversations = ref<AIConversation[]>(load());
const activeId = ref<string | null>(null);

const activeConversation = computed(
  () => conversations.value.find((item) => item.id === activeId.value) ?? null
);

function saveNow() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.value));
  } catch (error) {
    console.warn("保存历史对话失败", error);
  }
}

// 流式输出会高频更新，落盘做防抖；页面隐藏/关闭时立即保存
let saveTimer: number | undefined;
function scheduleSave() {
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(saveNow, 600);
}

watch(conversations, scheduleSave, { deep: true });

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", saveNow);
}

function createConversation(): AIConversation {
  const now = Date.now();
  const conversation: AIConversation = {
    id: nanoid(),
    title: DEFAULT_TITLE,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  conversations.value.unshift(conversation);
  if (conversations.value.length > MAX) {
    conversations.value.splice(MAX);
  }
  activeId.value = conversation.id;
  return conversation;
}

function appendMessage(
  conversation: AIConversation,
  message: Omit<AIChatMessage, "id" | "createdAt">
): AIChatMessage {
  const full: AIChatMessage = {
    id: nanoid(),
    createdAt: Date.now(),
    ...message,
  };
  conversation.messages.push(full);

  if (conversation.title === DEFAULT_TITLE && message.role === "user") {
    conversation.title = makeTitle(message.text);
  }
  conversation.updatedAt = Date.now();
  return full;
}

function newConversation() {
  activeId.value = null;
}

function selectConversation(id: string) {
  activeId.value = id;
}

function deleteConversation(id: string) {
  const index = conversations.value.findIndex((item) => item.id === id);
  if (index === -1) return;
  conversations.value.splice(index, 1);
  if (activeId.value === id) activeId.value = null;
}

export function useAIConversations() {
  return {
    conversations,
    activeId,
    activeConversation,
    createConversation,
    appendMessage,
    newConversation,
    selectConversation,
    deleteConversation,
  };
}

import { computed, ref, watch } from "vue";
import { nanoid } from "nanoid";

// 一次 AI 生成即一条历史对话
export interface AIConversation {
  id: string;
  title: string;
  prompt: string;
  output: string;
  reasoning: string;
  nodeCount: number;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "xy-whiteboard:ai-conversations";
// 历史上限，避免本地存储无限增长
const MAX = 50;

function makeTitle(prompt: string): string {
  const clean = prompt.replace(/\s+/g, " ").trim();
  if (!clean) return "新对话";
  return clean.length > 18 ? `${clean.slice(0, 18)}…` : clean;
}

function load(): AIConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AIConversation[]) : [];
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
  saveTimer = window.setTimeout(saveNow, 500);
}

watch(conversations, scheduleSave, { deep: true });

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", saveNow);
}

function createConversation(prompt: string): AIConversation {
  const now = Date.now();
  const conversation: AIConversation = {
    id: nanoid(),
    title: makeTitle(prompt),
    prompt,
    output: "",
    reasoning: "",
    nodeCount: 0,
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
    newConversation,
    selectConversation,
    deleteConversation,
  };
}

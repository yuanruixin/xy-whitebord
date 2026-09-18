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
      <div
        v-if="showSettings"
        class="flex max-h-[60%] flex-col gap-y-3 overflow-y-auto border-b border-slate-100 bg-slate-50/70 p-4"
      >
        <label class="flex flex-col gap-y-1 text-sm text-slate-700">
          <span>服务商</span>
          <select
            :value="config.provider"
            class="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-primary"
            @change="onProviderChange"
          >
            <option
              v-for="provider in providers"
              :key="provider.id"
              :value="provider.id"
            >
              {{ provider.label }}
            </option>
            <option :value="CUSTOM_PROVIDER_ID">自定义</option>
          </select>
        </label>

        <label class="flex flex-col gap-y-1 text-sm text-slate-700">
          <span class="flex items-center gap-x-1">
            API Key
            <span
              v-if="isApiKeyConfirmed"
              class="icon-[mdi--check-circle] text-green-500"
            ></span>
            <span
              v-else-if="hasApiKey"
              class="icon-[mdi--circle-medium] text-slate-400"
            ></span>
          </span>
          <div class="flex items-center gap-x-1">
            <input
              ref="apiKeyInputRef"
              v-model="config.apiKey"
              type="password"
              autocomplete="off"
              placeholder="sk-..."
              class="min-w-0 flex-1 rounded-md border px-2 py-1.5 text-sm outline-none focus:border-primary"
              :class="
                hasApiKey ? 'border-slate-200' : 'border-red-300 bg-red-50/40'
              "
              @keydown.enter.prevent="confirmApiKey"
            />
            <button
              type="button"
              class="shrink-0 rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!hasApiKey || isApiKeyConfirmed"
              @click="confirmApiKey"
            >
              确认
            </button>
          </div>
          <span v-if="!hasApiKey" class="text-xs text-red-500">
            尚未填写 API Key，无法使用
          </span>
          <span v-else-if="!isApiKeyConfirmed" class="text-xs text-slate-400">
            未确认，点击「确认」或按回车后生效
          </span>
        </label>

        <label class="flex flex-col gap-y-1 text-sm text-slate-700">
          <span>Base URL</span>
          <ComboBox
            v-model="config.baseURL"
            :options="baseURLOptions"
            placeholder="https://api.openai.com/v1"
          />
        </label>

        <label class="flex flex-col gap-y-1 text-sm text-slate-700">
          <span>模型</span>
          <ComboBox
            v-model="config.model"
            :options="modelOptions"
            placeholder="gpt-4o-mini"
          />
        </label>

        <div class="flex items-center justify-between">
          <span class="flex flex-col">
            <span>深度思考</span>
            <span class="text-xs text-slate-400">关闭可显著加快生成</span>
          </span>
          <Switch
            v-model="config.thinking"
            :class="config.thinking ? 'bg-primary' : 'bg-slate-200'"
            class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors"
          >
            <span
              :class="config.thinking ? 'translate-x-4' : 'translate-x-0.5'"
              class="inline-block size-4 transform rounded-full bg-white shadow transition-transform"
            />
          </Switch>
        </div>

        <p class="text-xs leading-5 text-slate-400">
          API Key 加密后仅保存在本地浏览器；每个服务商/模型可分别保存各自
          Key，切换时自动读取。
        </p>
      </div>

      <!-- 历史对话 -->
      <div v-if="showHistory" class="flex-1 overflow-y-auto p-2">
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

          <template v-for="message in messages" :key="message.id">
            <!-- 用户 -->
            <div v-if="message.role === 'user'" class="flex justify-end">
              <div
                class="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-3 py-2 text-sm text-white"
              >
                {{ message.text }}
              </div>
            </div>

            <!-- 助手 -->
            <div v-else class="flex flex-col items-start gap-y-2">
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
                <span
                  v-else
                  class="whitespace-pre-wrap break-words leading-6"
                >
                  {{ message.text }}
                </span>
              </div>

              <div
                v-if="message.tools?.length"
                class="flex flex-wrap gap-1.5"
              >
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
            </div>
          </template>
        </div>

        <!-- 输入区 -->
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
              @click="confirmApiKey"
            >
              确认
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
              class="flex items-center gap-x-1 rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-xs text-primary hover:bg-primary/10"
              @click="pinSelection"
            >
              <span class="icon-[mdi--cursor-default-click-outline]"></span>
              引用选中图形 ({{ selection.length }})
            </button>
            <span
              v-for="node in pinnedSelection"
              :key="node.id"
              class="flex items-center gap-x-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
            >
              {{ node.label || node.type }}
              <button
                type="button"
                class="text-slate-400 hover:text-red-500"
                @click="unpinSelection(node.id)"
              >
                <span class="icon-[mdi--close] text-xs"></span>
              </button>
            </span>
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
              <span
                v-if="loading"
                class="icon-[mdi--stop] text-lg"
              ></span>
              <span v-else class="icon-[mdi--send] text-lg"></span>
            </button>
          </div>
          <p v-if="error" class="mt-2 text-xs text-red-500">{{ error }}</p>
        </div>
      </template>

      <!-- 危险操作确认 -->
      <div
        v-if="confirmRequest"
        class="absolute inset-0 z-10 flex items-center justify-center bg-black/30 p-4"
      >
        <div class="w-full rounded-xl bg-white p-4 shadow-xl">
          <div class="flex items-center gap-x-2 text-slate-800">
            <span
              class="icon-[mdi--alert-outline] text-lg text-amber-500"
            ></span>
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
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { Switch } from "@headlessui/vue";
import { useRenderStore } from "@/store/render";
import { useAIStore } from "@/store/ai";
import { useSelectionStore } from "@/store/selection";
import {
  useAIConversations,
  type AIConversation,
  type AIChatMessage,
} from "@/store/aiConversations";
import { AI_PROVIDERS, CUSTOM_PROVIDER_ID } from "@/constants/aiProviders";
import ComboBox from "./ComboBox.vue";
import {
  runCanvasAgent,
  parseScene,
  tryParseScene,
  CANVAS_TOOL_LABELS,
  type AIChatTurn,
  type AIStatus,
  type AIToolCallRecord,
  type CanvasNodeInfo,
  type ConfirmationRequest,
} from "@/utils/ai";

const { render } = useRenderStore();
const {
  config,
  hasApiKey,
  isApiKeyConfirmed,
  confirmApiKey,
  showDialog,
  showSettings,
  applyProvider,
} = useAIStore();

const {
  conversations,
  activeId,
  activeConversation,
  createConversation,
  appendMessage,
  newConversation,
  selectConversation,
  deleteConversation,
} = useAIConversations();

const providers = AI_PROVIDERS;
const baseURLOptions = AI_PROVIDERS.map((provider) => provider.baseURL);
const apiKeyInputRef = ref<HTMLInputElement | null>(null);
const inputRef = ref<HTMLTextAreaElement | null>(null);
const messagesRef = ref<HTMLDivElement | null>(null);

const showHistory = ref(false);
const input = ref("");
const loading = ref(false);
const error = ref("");
const status = ref<AIStatus>("idle");

let controller: AbortController | null = null;

// 危险操作确认
const confirmRequest = ref<ConfirmationRequest | null>(null);
let confirmResolver: ((approved: boolean) => void) | null = null;

const confirmSummary = computed(() => confirmRequest.value?.summary ?? "");

// 确认框中列出将被操作的元素（按 id 从当前画布解析）
const confirmTargets = computed<CanvasNodeInfo[]>(() => {
  const request = confirmRequest.value;
  if (!request || !render.value) return [];
  const args = request.args as { ids?: unknown } | undefined;
  const ids = Array.isArray(args?.ids) ? args.ids.map(String) : [];
  if (ids.length === 0) return [];
  const data = render.value.canvasTool.getCanvas().data as
    | { nodes?: CanvasNodeInfo[] }
    | undefined;
  return (data?.nodes ?? []).filter((node) => ids.includes(node.id));
});

function resolveConfirm(approved: boolean) {
  const resolver = confirmResolver;
  confirmResolver = null;
  confirmRequest.value = null;
  resolver?.(approved);
}

// 选中图形引用：把画布上选中的元素附加到本次提问
const selection = useSelectionStore();
const pinnedSelection = ref<CanvasNodeInfo[]>([]);

function pinSelection() {
  const merged = new Map<string, CanvasNodeInfo>();
  [...pinnedSelection.value, ...selection.value].forEach((node) =>
    merged.set(node.id, node)
  );
  pinnedSelection.value = [...merged.values()];
}

function unpinSelection(id: string) {
  pinnedSelection.value = pinnedSelection.value.filter(
    (node) => node.id !== id
  );
}

function clearPinnedSelection() {
  pinnedSelection.value = [];
}

// 生成选中元素的上下文描述（按 id 解析最新位置）
function buildSelectionContext(): string {
  if (pinnedSelection.value.length === 0 || !render.value) return "";
  const ids = pinnedSelection.value.map((node) => node.id);
  const data = render.value.canvasTool.getCanvas().data as
    | { nodes?: CanvasNodeInfo[] }
    | undefined;
  const nodes = (data?.nodes ?? []).filter((node) => ids.includes(node.id));
  if (nodes.length === 0) return "";
  return [
    "用户在画布上选中了以下元素：",
    ...nodes.map(
      (node) =>
        `- id=${node.id} ${node.type}${
          node.label ? `「${node.label}」` : ""
        }: x=${node.x}, y=${node.y}, w=${node.width}, h=${node.height}`
    ),
  ].join("\n");
}

const examples = [
  "画一个用户登录流程图",
  "用四步说明软件开发流程",
  "画一个简单的思维导图：前端、后端、数据库",
];

const STATUS_TEXT: Record<AIStatus, string> = {
  idle: "思考中...",
  connecting: "正在连接模型...",
  reasoning: "模型思考中...",
  generating: "正在生成图形...",
  acting: "正在操作画布...",
  parsing: "正在解析并导入画布...",
};

// 画布工具的中文名，用于展示操作过程
function describeToolCall(record: AIToolCallRecord): string {
  const label =
    CANVAS_TOOL_LABELS[record.name as keyof typeof CANVAS_TOOL_LABELS] ??
    record.name;
  return record.result.message || label;
}

const statusText = computed(() => STATUS_TEXT[status.value]);
const messages = computed(() => activeConversation.value?.messages ?? []);
const canSend = computed(() => loading.value || input.value.trim().length > 0);

// 当前服务商的模型列表；自定义时汇总所有预置模型
const modelOptions = computed(() => {
  const provider = AI_PROVIDERS.find((item) => item.id === config.provider);
  if (provider) return provider.models;
  return Array.from(new Set(AI_PROVIDERS.flatMap((item) => item.models)));
});

function onProviderChange(event: Event) {
  applyProvider((event.target as HTMLSelectElement).value);
}

function toggleSettings() {
  showSettings.value = !showSettings.value;
  if (showSettings.value) showHistory.value = false;
}

function toggleHistory() {
  showHistory.value = !showHistory.value;
  if (showHistory.value) showSettings.value = false;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const sameDay = date.toDateString() === new Date().toDateString();
  const time = date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return sameDay ? time : `${date.getMonth() + 1}-${date.getDate()} ${time}`;
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

function onStop() {
  resolveConfirm(false);
  controller?.abort();
}

function startNewConversation() {
  resolveConfirm(false);
  controller?.abort();
  controller = null;
  loading.value = false;
  status.value = "idle";
  newConversation();
  input.value = "";
  error.value = "";
  clearPinnedSelection();
  showHistory.value = false;
}

function openConversation(conversation: AIConversation) {
  if (loading.value) return;
  selectConversation(conversation.id);
  error.value = "";
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
    error.value = "";
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

function removeMessage(conversation: AIConversation, id: string) {
  const index = conversation.messages.findIndex((item) => item.id === id);
  if (index !== -1) conversation.messages.splice(index, 1);
}

async function send() {
  if (loading.value) return;
  const text = input.value.trim();
  if (!text) return;

  if (!hasApiKey.value) {
    error.value = "请先填写 API Key";
    showSettings.value = true;
    await nextTick();
    apiKeyInputRef.value?.focus();
    return;
  }
  if (!isApiKeyConfirmed.value) {
    error.value = "请先确认 API Key";
    showSettings.value = true;
    return;
  }

  error.value = "";
  input.value = "";
  await nextTick();
  autoGrow();

  const conversation = activeConversation.value ?? createConversation();
  appendMessage(conversation, { role: "user", text });
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
        message.role === "assistant" ? message.raw ?? message.text : message.text,
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
        onConfirm: (request) =>
          new Promise<boolean>((resolve) => {
            confirmRequest.value = request;
            confirmResolver = resolve;
          }),
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

// 关闭侧边栏时中断生成
watch(showDialog, (open) => {
  if (!open && loading.value) {
    resolveConfirm(false);
    controller?.abort();
  }
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

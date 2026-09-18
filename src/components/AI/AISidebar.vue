<template>
  <Transition name="ai-slide">
    <aside
      v-if="showDialog"
      class="fixed right-0 top-12 bottom-0 z-40 flex w-[22rem] flex-col border-l border-slate-200 bg-white shadow-xl"
      @wheel.stop
    >
      <div class="flex items-center gap-x-2 border-b border-slate-100 px-4 py-3">
        <span class="icon-[mdi--robot-outline] text-xl text-primary"></span>
        <h3 class="font-semibold text-slate-800">AI 生成图形</h3>
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
            @click="showHistory = !showHistory"
          >
            <span class="icon-[mdi--history]"></span>
          </button>
          <button
            type="button"
            class="grid size-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
            v-tooltip="'API 设置'"
            @click="showSettings = !showSettings"
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

      <div class="flex flex-1 flex-col gap-y-4 overflow-y-auto p-4">
        <!-- 历史对话列表 -->
        <template v-if="showHistory">
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
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm text-slate-700">
                  {{ conversation.title }}
                </div>
                <div class="mt-0.5 text-xs text-slate-400">
                  {{ conversation.nodeCount }} 个节点 ·
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
        </template>

        <template v-else>
        <!-- 设置 -->
        <div
          v-if="showSettings"
          class="flex flex-col gap-y-3 rounded-lg bg-slate-50 p-3"
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
              尚未填写 API Key，无法生成
            </span>
            <span v-else-if="!isApiKeyConfirmed" class="text-xs text-slate-400">
              未确认，点击「确认」或按回车后生效
            </span>
            <span v-else class="text-xs text-slate-400">
              已确认，不同模型分别保存，切换时自动读取
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
            API Key 加密后保存在本地浏览器，不会上传到服务器。兼容 OpenAI 接口格式（OpenAI、DeepSeek、通义千问、智谱等）。
          </p>
        </div>

        <!-- 未配置 / 未确认 token 的提示 -->
        <div
          v-if="!hasApiKey"
          class="flex items-center gap-x-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600"
        >
          <span class="icon-[mdi--alert-circle-outline] text-base"></span>
          <span>尚未配置 API Key</span>
          <button
            type="button"
            class="ml-auto font-medium text-primary hover:underline"
            @click="showSettings = true"
          >
            去配置
          </button>
        </div>
        <div
          v-else-if="!isApiKeyConfirmed"
          class="flex items-center gap-x-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500"
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

        <!-- 提示词 -->
        <label class="flex flex-col gap-y-1 text-sm text-slate-700">
          <span>描述你想要的图形</span>
          <textarea
            v-model="prompt"
            rows="4"
            placeholder="例如：画一个用户登录流程图，包含开始、输入账号密码、校验、成功、失败等节点"
            class="resize-none rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-primary"
            @keydown.enter.meta.prevent="onGenerate"
            @keydown.enter.ctrl.prevent="onGenerate"
          ></textarea>
        </label>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="example in examples"
            :key="example"
            type="button"
            class="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-slate-200"
            @click="prompt = example"
          >
            {{ example }}
          </button>
        </div>

        <!-- 操作 -->
        <div class="flex items-center gap-x-2">
          <button
            type="button"
            class="flex flex-1 items-center justify-center gap-x-1.5 rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="loading"
            @click="onGenerate"
          >
            <span v-if="loading" class="icon-[mdi--loading] animate-spin"></span>
            {{ loading ? "生成中..." : "生成并导入" }}
          </button>
          <button
            v-if="loading"
            type="button"
            class="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
            @click="onStop"
          >
            停止
          </button>
        </div>

        <button
          v-if="canReimport"
          type="button"
          class="flex items-center justify-center gap-x-1.5 rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          @click="reimport"
        >
          <span class="icon-[mdi--import]"></span>
          重新导入画布
        </button>

        <!-- 过程反馈 -->
        <div
          v-if="loading || output || reasoning || doneMessage"
          class="flex flex-col gap-y-2"
        >
          <div v-if="loading || doneMessage" class="flex items-center gap-x-2 text-xs text-slate-500">
            <span
              v-if="loading"
              class="icon-[mdi--loading] animate-spin text-primary"
            ></span>
            <span
              v-else
              class="icon-[mdi--check-circle-outline] text-green-500"
            ></span>
            <span>{{ loading ? statusText : doneMessage }}</span>
          </div>

          <div
            v-if="reasoning"
            class="max-h-40 overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-amber-100 bg-amber-50 p-2 text-xs leading-5 text-amber-700"
          >
            {{ reasoning }}
          </div>

          <div
            v-if="output"
            ref="outputRef"
            class="max-h-56 overflow-y-auto whitespace-pre-wrap break-all rounded-md bg-slate-900 p-2 font-mono text-xs leading-5 text-slate-100"
          >
            {{ output }}
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
        </template>
      </div>
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { Switch } from "@headlessui/vue";
import { useRenderStore } from "@/store/render";
import { useAIStore } from "@/store/ai";
import {
  useAIConversations,
  type AIConversation,
} from "@/store/aiConversations";
import { AI_PROVIDERS, CUSTOM_PROVIDER_ID } from "@/constants/aiProviders";
import ComboBox from "./ComboBox.vue";
import {
  generateSceneStream,
  parseScene,
  type AIScene,
  type AIStatus,
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
  newConversation,
  selectConversation,
  deleteConversation,
} = useAIConversations();

const providers = AI_PROVIDERS;
const baseURLOptions = AI_PROVIDERS.map((provider) => provider.baseURL);
const apiKeyInputRef = ref<HTMLInputElement | null>(null);
const showHistory = ref(false);

// 当前服务商的模型列表；自定义时汇总所有预置模型
const modelOptions = computed(() => {
  const provider = AI_PROVIDERS.find((item) => item.id === config.provider);
  if (provider) return provider.models;
  return Array.from(new Set(AI_PROVIDERS.flatMap((item) => item.models)));
});

function onProviderChange(event: Event) {
  applyProvider((event.target as HTMLSelectElement).value);
}

const prompt = ref("");
const loading = ref(false);
const error = ref("");
const status = ref<AIStatus>("idle");
const output = ref("");
const reasoning = ref("");
const doneMessage = ref("");
const outputRef = ref<HTMLDivElement | null>(null);

let controller: AbortController | null = null;

const examples = [
  "画一个用户登录流程图",
  "用四步说明软件开发流程",
  "画一个简单的思维导图：前端、后端、数据库",
];

const STATUS_TEXT: Record<AIStatus, string> = {
  idle: "",
  connecting: "正在连接模型...",
  reasoning: "模型思考中...",
  generating: "正在生成图形...",
  parsing: "正在解析并导入画布...",
};

const statusText = computed(() => STATUS_TEXT[status.value]);

// 历史对话有输出且当前不在生成中，可重新导入
const canReimport = computed(
  () => !loading.value && !!activeConversation.value?.output.trim()
);

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const sameDay = date.toDateString() === new Date().toDateString();
  const time = date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return sameDay ? time : `${date.getMonth() + 1}-${date.getDate()} ${time}`;
}

// 流式输出时自动滚动到底部
watch(output, async () => {
  await nextTick();
  const el = outputRef.value;
  if (el) el.scrollTop = el.scrollHeight;
});

// 关闭侧边栏时中断生成
watch(showDialog, (open) => {
  if (!open) controller?.abort();
});

function resetStream() {
  output.value = "";
  reasoning.value = "";
  doneMessage.value = "";
  error.value = "";
  status.value = "idle";
}

function onStop() {
  controller?.abort();
}

function startNewConversation() {
  // 生成中则中断，避免流式回调污染新对话
  controller?.abort();
  controller = null;
  loading.value = false;
  newConversation();
  resetStream();
  prompt.value = "";
  showHistory.value = false;
}

function openConversation(conversation: AIConversation) {
  if (loading.value) return;
  selectConversation(conversation.id);
  prompt.value = conversation.prompt;
  output.value = conversation.output;
  reasoning.value = conversation.reasoning;
  error.value = "";
  status.value = "idle";
  doneMessage.value = conversation.nodeCount
    ? `已生成 ${conversation.nodeCount} 个节点并导入画布`
    : "";
  showHistory.value = false;
}

function removeConversation(id: string) {
  deleteConversation(id);
}

function reimport() {
  const conversation = activeConversation.value;
  if (!conversation?.output.trim()) return;
  if (!render.value) {
    error.value = "画布尚未初始化";
    return;
  }
  try {
    const scene = parseScene(conversation.output);
    render.value.aiTool.generate(scene);
    doneMessage.value = `已重新导入 ${scene.nodes.length} 个节点`;
    error.value = "";
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

async function onGenerate() {
  if (loading.value) return;

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

  if (!prompt.value.trim()) {
    error.value = "请输入图形描述";
    return;
  }

  resetStream();
  loading.value = true;
  controller = new AbortController();
  const currentController = controller;

  // 每次生成创建一条新的历史对话
  const conversation = createConversation(prompt.value);

  try {
    const scene: AIScene = await generateSceneStream(
      prompt.value,
      { ...config },
      {
        signal: controller.signal,
        onStatus: (s) => (status.value = s),
        onContent: (_delta, full) => {
          output.value = full;
          conversation.output = full;
          conversation.updatedAt = Date.now();
        },
        onReasoning: (_delta, full) => {
          reasoning.value = full;
          conversation.reasoning = full;
          conversation.updatedAt = Date.now();
        },
      }
    );

    if (!render.value) throw new Error("画布尚未初始化");
    render.value.aiTool.generate(scene);
    conversation.nodeCount = scene.nodes.length;
    conversation.output = output.value;
    conversation.updatedAt = Date.now();
    doneMessage.value = `已生成 ${scene.nodes.length} 个节点并导入画布`;
  } catch (e) {
    // 已被「新对话」中断或替换，忽略即可
    if (controller !== currentController) return;
    if ((e as Error)?.name === "AbortError") {
      error.value = "已停止生成";
    } else {
      error.value = e instanceof Error ? e.message : String(e);
    }
    // 没有任何产出（含推理）的失败对话不保留
    if (!conversation.output.trim() && !conversation.reasoning.trim()) {
      deleteConversation(conversation.id);
    }
  } finally {
    if (controller === currentController) {
      loading.value = false;
      controller = null;
      status.value = "idle";
    }
  }
}
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

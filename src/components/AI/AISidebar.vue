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
        <!-- 设置 -->
        <div
          v-if="showSettings"
          class="flex flex-col gap-y-3 rounded-lg bg-slate-50 p-3"
        >
          <label class="flex flex-col gap-y-1 text-sm text-slate-700">
            <span>API Key</span>
            <input
              v-model="config.apiKey"
              type="password"
              autocomplete="off"
              placeholder="sk-..."
              class="rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-primary"
            />
          </label>
          <label class="flex flex-col gap-y-1 text-sm text-slate-700">
            <span>Base URL</span>
            <input
              v-model="config.baseURL"
              type="text"
              placeholder="https://api.openai.com/v1"
              class="rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-primary"
            />
          </label>
          <label class="flex flex-col gap-y-1 text-sm text-slate-700">
            <span>模型</span>
            <input
              v-model="config.model"
              type="text"
              placeholder="gpt-4o-mini"
              class="rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-primary"
            />
          </label>
          <p class="text-xs leading-5 text-slate-400">
            仅保存在本地浏览器。兼容 OpenAI 接口格式（OpenAI、DeepSeek、通义千问、智谱等）。
          </p>
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

        <!-- 过程反馈 -->
        <div v-if="loading || doneMessage" class="flex flex-col gap-y-2">
          <div class="flex items-center gap-x-2 text-xs text-slate-500">
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
      </div>
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useRenderStore } from "@/store/render";
import { useAIStore } from "@/store/ai";
import {
  generateSceneStream,
  type AIScene,
  type AIStatus,
} from "@/utils/ai";

const { render } = useRenderStore();
const { config, showDialog, showSettings } = useAIStore();

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

async function onGenerate() {
  if (loading.value) return;
  if (!prompt.value.trim()) {
    error.value = "请输入图形描述";
    return;
  }

  resetStream();
  loading.value = true;
  controller = new AbortController();

  try {
    const scene: AIScene = await generateSceneStream(
      prompt.value,
      { ...config },
      {
        signal: controller.signal,
        onStatus: (s) => (status.value = s),
        onContent: (_delta, full) => (output.value = full),
        onReasoning: (_delta, full) => (reasoning.value = full),
      }
    );

    if (!render.value) throw new Error("画布尚未初始化");
    render.value.aiTool.generate(scene);
    doneMessage.value = `已生成 ${scene.nodes.length} 个节点并导入画布`;
  } catch (e) {
    if ((e as Error)?.name === "AbortError") {
      error.value = "已停止生成";
    } else {
      error.value = e instanceof Error ? e.message : String(e);
    }
  } finally {
    loading.value = false;
    controller = null;
    status.value = "idle";
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

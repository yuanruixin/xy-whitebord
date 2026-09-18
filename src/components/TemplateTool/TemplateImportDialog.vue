<template>
  <div
    v-if="open"
    class="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4"
  >
    <div
      class="flex max-h-[92vh] w-full max-w-2xl flex-col gap-y-3 overflow-y-auto rounded-xl bg-white p-5 text-left shadow-xl"
      @wheel.stop
    >
      <div class="flex items-center gap-x-2 text-slate-800">
        <span class="icon-[mdi--import] text-lg text-primary"></span>
        <h4 class="font-semibold">导入模板</h4>
        <button
          type="button"
          class="ml-auto text-slate-400 hover:text-slate-600"
          @click="close"
        >
          <span class="icon-[mdi--close]"></span>
        </button>
      </div>

      <p class="rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
        在画布创建图形后通过「导出 JSON」保存，再在此上传。导入 JSON 后会
        <span class="text-primary">自动解析图形并生成封面</span>，也可以自行上传或填写封面图片。
      </p>

      <!-- 第一行：模板名称 -->
      <label class="flex flex-col gap-y-1 text-sm text-slate-700">
        <span>模板名称</span>
        <input
          v-model="title"
          type="text"
          placeholder="例如：我的流程图"
          class="rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-primary"
        />
      </label>

      <!-- 第二行：两列（JSON 解析 / 封面设置） -->
      <div class="grid grid-cols-2 gap-x-4">
        <!-- 左：JSON 解析 -->
        <div class="flex flex-col gap-y-1 text-sm text-slate-700">
          <span class="flex items-center gap-x-1">
            模板 JSON
            <span
              v-if="json.trim()"
              class="icon-[mdi--check-circle] text-green-500"
            ></span>
          </span>
          <button
            type="button"
            class="flex w-full cursor-pointer items-center justify-center gap-x-2 rounded-lg border-2 border-dashed border-slate-300 px-3 py-3 text-slate-400 transition hover:border-primary hover:bg-primary/5 hover:text-primary"
            @click="pickJson"
            @dragover.prevent
            @drop.prevent="onJsonDrop"
          >
            <span class="icon-[mdi--file-upload-outline] text-2xl"></span>
            <span class="text-sm">
              {{ json.trim() ? "已载入，点击可更换" : "点击或拖拽上传 JSON" }}
            </span>
          </button>
          <input
            ref="jsonInputRef"
            type="file"
            accept=".json,application/json"
            class="hidden"
            @change="onJsonFile"
          />
          <textarea
            v-model="json"
            placeholder="或直接粘贴 JSON"
            class="h-36 w-full resize-none rounded-md border border-slate-200 px-2 py-1.5 font-mono text-xs leading-5 outline-none focus:border-primary"
          ></textarea>
        </div>

        <!-- 右：封面设置 -->
        <div class="flex flex-col gap-y-1 text-sm text-slate-700">
          <span class="flex items-center gap-x-1">
            封面设置
            <span
              v-if="autoCover"
              class="text-xs font-normal text-slate-400"
            >（已自动解析）</span>
          </span>
          <div
            v-if="cover"
            class="relative aspect-[13/9] w-full overflow-hidden rounded-lg border border-slate-200"
          >
            <img :src="cover" class="h-full w-full object-cover" />
            <div
              class="absolute inset-x-0 bottom-0 flex justify-end gap-x-1 bg-black/40 p-1"
            >
              <button
                type="button"
                class="grid size-6 place-items-center rounded text-white hover:bg-white/20"
                v-tooltip="'更换封面'"
                @click="pickCover"
              >
                <span class="icon-[mdi--image-edit-outline] text-sm"></span>
              </button>
              <button
                type="button"
                class="grid size-6 place-items-center rounded text-white hover:bg-white/20"
                v-tooltip="'清除封面'"
                @click="clearCover"
              >
                <span class="icon-[mdi--close] text-sm"></span>
              </button>
            </div>
          </div>
          <button
            v-else
            type="button"
            class="flex aspect-[13/9] w-full cursor-pointer flex-col items-center justify-center gap-y-1 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-primary hover:bg-primary/5 hover:text-primary"
            @click="pickCover"
            @dragover.prevent
            @drop.prevent="onCoverDrop"
          >
            <span class="icon-[mdi--plus] text-2xl"></span>
            <span class="text-xs">点击或拖拽上传封面</span>
          </button>
          <input
            ref="coverInputRef"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onCoverFile"
          />
          <input
            v-model="cover"
            type="text"
            placeholder="或粘贴图片链接"
            class="rounded-md border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-primary"
            @input="autoCover = false"
          />
          <span
            v-if="autoCover"
            class="flex items-center gap-x-1 text-xs text-slate-400"
          >
            <span class="icon-[mdi--check-circle] text-green-500"></span>
            已根据 JSON 自动生成封面
          </span>
        </div>
      </div>

      <p v-if="error" class="text-xs text-red-500">{{ error }}</p>

      <div class="flex justify-end gap-x-2">
        <button
          type="button"
          class="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          @click="close"
        >
          取消
        </button>
        <button
          type="button"
          class="rounded-md bg-primary px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!canAdd"
          @click="submit"
        >
          添加模板
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { debounce } from "lodash-es";
import { readFileAsDataURL, readFileAsText } from "@/utils/handleFile";
import { konvaJsonToSvg } from "@/utils/konvaToSvg";

export interface TemplateDraft {
  info: {
    title: string;
    description: string;
    category: string;
    cover: string;
  };
  data: object;
}

const props = defineProps<{
  open: boolean;
  // 编辑已有模板时传入初始值
  initial?: { title: string; cover: string; json: string } | null;
}>();
const emit = defineEmits<{
  (e: "close"): void;
  (e: "add", draft: TemplateDraft): void;
}>();

const title = ref("");
const cover = ref("");
const json = ref("");
const error = ref("");
// 封面是否来自 JSON 自动生成的 SVG
const autoCover = ref(false);

const coverInputRef = ref<HTMLInputElement | null>(null);
const jsonInputRef = ref<HTMLInputElement | null>(null);

const canAdd = computed(() => json.value.trim().length > 0);

// 根据导入的 JSON 自动生成 SVG 封面
const generateCover = debounce(() => {
  const svg = konvaJsonToSvg(json.value);
  if (svg) {
    cover.value = svg;
    autoCover.value = true;
  }
}, 300);

watch(json, () => {
  if (!json.value.trim()) return;
  // 已有非自动生成的封面时不覆盖
  if (cover.value && !autoCover.value) return;
  generateCover();
});

function reset() {
  title.value = "";
  cover.value = "";
  json.value = "";
  error.value = "";
  autoCover.value = false;
}

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    if (props.initial) {
      title.value = props.initial.title;
      cover.value = props.initial.cover;
      json.value = props.initial.json;
      error.value = "";
      autoCover.value = false;
    } else {
      reset();
    }
  }
);

function close() {
  emit("close");
}

function pickCover() {
  coverInputRef.value?.click();
}

function pickJson() {
  jsonInputRef.value?.click();
}

async function applyCoverFile(file: File | undefined | null) {
  if (!file) return;
  cover.value = await readFileAsDataURL(file);
  autoCover.value = false;
}

function clearCover() {
  cover.value = "";
  autoCover.value = false;
}

async function applyJsonFile(file: File | undefined | null) {
  if (!file) return;
  json.value = await readFileAsText(file);
}

async function onCoverFile(event: Event) {
  const input = event.target as HTMLInputElement;
  await applyCoverFile(input.files?.[0]);
  input.value = "";
}

async function onJsonFile(event: Event) {
  const input = event.target as HTMLInputElement;
  await applyJsonFile(input.files?.[0]);
  input.value = "";
}

function onCoverDrop(event: DragEvent) {
  void applyCoverFile(event.dataTransfer?.files?.[0]);
}

function onJsonDrop(event: DragEvent) {
  void applyJsonFile(event.dataTransfer?.files?.[0]);
}

function submit() {
  error.value = "";
  const jsonText = json.value.trim();
  if (!jsonText) {
    error.value = "请提供模板 JSON";
    return;
  }

  let data: { className?: string; type?: string };
  try {
    data = JSON.parse(jsonText);
  } catch {
    error.value = "JSON 解析失败，请检查内容";
    return;
  }

  const isKonvaStage = data?.className === "Stage";
  const isSceneDocument = data?.type === "xy-whiteboard";
  if (!data || typeof data !== "object" || (!isKonvaStage && !isSceneDocument)) {
    error.value = "不是有效的画布导出 JSON（应为 Stage 或 xy-whiteboard 文档）";
    return;
  }

  emit("add", {
    info: {
      title: title.value.trim() || "自定义模板",
      description: "自定义模板",
      category: "custom",
      cover: cover.value.trim(),
    },
    data: data as object,
  });
}
</script>

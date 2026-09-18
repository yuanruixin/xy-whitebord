<template>
  <div class="flex flex-col gap-y-4">
    <!-- 导入入口 -->
    <div class="flex items-start justify-between gap-x-4">
      <p class="max-w-[40rem] text-xs leading-5 text-slate-400">
        快来使用模板吧，也可以自定义绘制 或者使用站内的 AI 生成 模板，然后导出 JSON 后，在此导入作为模板。
      </p>
      <button
        type="button"
        class="flex shrink-0 items-center gap-x-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
        @click="openImport"
      >
        <span class="icon-[mdi--import]"></span>
        导入模板
      </button>
    </div>

    <!-- 模板列表 -->
    <div
      class="template-wrapper grid grid-cols-[min-content_min-content_min-content] justify-between select-none"
    >
      <div
        v-for="(template, index) in templates"
        :key="template.id || template.info.title + index"
        class="cursor-pointer rounded-md"
      >
        <div class="template-item">
          <div
            class="item-show relative h-max group w-max overflow-hidden shadow-md hover:ring-2 transition duration-300 ease-in-out"
            :value="index"
          >
            <div class="template-bg p-6 bg-white">
              <img
                v-if="template.info.cover"
                :src="template.info.cover"
                class="w-52 h-36 object-cover"
              />
              <div
                v-else
                class="flex h-36 w-52 items-center justify-center text-slate-300"
              >
                <span class="icon-[mdi--image-off-outline] text-3xl"></span>
              </div>
            </div>
            <div
              class="template-actions absolute left-0 top-0 flex h-full w-full flex-col p-6 translate-y-full group-hover:translate-y-0 group-hover:bg-white transition duration-200 ease-in-out"
            >
              <div>{{ template.info.description }}</div>
              <div class="ml-auto mt-auto flex items-center gap-x-1.5">
                <button
                  v-if="template.custom"
                  type="button"
                  class="flex h-6 items-center rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600 hover:bg-slate-100"
                  @click.stop="openEdit(template)"
                >
                  编辑
                </button>
                <button
                  v-if="template.custom"
                  type="button"
                  class="flex h-6 items-center rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600 hover:bg-slate-100"
                  @click.stop="removeTemplate(template)"
                >
                  删除
                </button>
                <button
                  class="flex h-6 items-center rounded-md bg-[#4e95ff] px-2 text-xs text-white hover:opacity-90"
                  @click="confirmUseTemplate(index)"
                >
                  使用
                </button>
              </div>
            </div>
          </div>
          <div class="item-title mt-2 flex items-center justify-between gap-x-2">
            <span class="font-bold">{{ template.info.title }}</span>
            <button
              v-if="template.custom"
              type="button"
              class="text-slate-400 hover:text-red-500"
              v-tooltip="'删除模板'"
              @click.stop="removeTemplate(template)"
            >
              <span class="icon-[mdi--trash-can-outline]"></span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认 -->
    <div
      v-if="pendingDelete"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
    >
      <div class="w-full max-w-xs rounded-xl bg-white p-4 shadow-xl">
        <div class="flex items-center gap-x-2 text-slate-800">
          <span class="icon-[mdi--alert-outline] text-lg text-amber-500"></span>
          <h4 class="font-semibold">删除模板</h4>
        </div>
        <p class="mt-2 text-sm text-slate-600">
          确定删除「{{ pendingDelete.info.title }}」吗？此操作不可恢复。
        </p>
        <div class="mt-4 flex justify-end gap-x-2">
          <button
            type="button"
            class="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            @click="pendingDelete = null"
          >
            取消
          </button>
          <button
            type="button"
            class="rounded-md bg-red-500 px-3 py-1.5 text-sm text-white hover:bg-red-600"
            @click="confirmDelete"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- 导入模板弹层 -->
    <TemplateImportDialog
      :open="showImport"
      :initial="editingDraft"
      @close="closeImport"
      @add="onAddTemplate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRenderStore } from "@/store/render";
import TemplateImportDialog, {
  type TemplateDraft,
} from "./TemplateImportDialog.vue";
import arrowTemplate from "./templates/arrow.json";
import rabbitTemplate from "./templates/rabbit.json";
import pelicanTemplate from "./templates/pelican.json";

const { render } = useRenderStore();

const emit = defineEmits<{
  (e: "close"): void;
}>();

interface TemplateItem {
  id?: string;
  info: {
    title: string;
    description: string;
    category: string;
    cover: string;
  };
  data: object;
  custom?: boolean;
}

const STORAGE_KEY = "xy-whiteboard:custom-templates";

function getURL(name: string) {
  return new URL(`./templates/covers/${name}`, import.meta.url).href;
}

// 内置模板（封面为相对路径，转为实际地址）
const builtinTemplates: TemplateItem[] = [
  arrowTemplate,
  rabbitTemplate,
  pelicanTemplate,
].map((item) => ({
  id: item.id,
  info: { ...item.info, cover: getURL(item.info.cover) },
  data: item.data,
  custom: false,
}));

// 用户导入的模板（封面为链接或 base64，持久化在本地）
const customTemplates = ref<TemplateItem[]>(loadCustom());

const templates = computed(() => [...builtinTemplates, ...customTemplates.value]);

const showImport = ref(false);
// 正在编辑的自定义模板（null 表示新增）
const editingTemplate = ref<TemplateItem | null>(null);
// 待删除的自定义模板
const pendingDelete = ref<TemplateItem | null>(null);

const editingDraft = computed(() =>
  editingTemplate.value
    ? {
        title: editingTemplate.value.info.title,
        cover: editingTemplate.value.info.cover,
        json: JSON.stringify(editingTemplate.value.data),
      }
    : null
);

function loadCustom(): TemplateItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveCustom() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customTemplates.value));
  } catch {
    // 图片过大可能超出配额，忽略
  }
}

function openImport() {
  editingTemplate.value = null;
  showImport.value = true;
}

function openEdit(template: TemplateItem) {
  editingTemplate.value = template;
  showImport.value = true;
}

function closeImport() {
  showImport.value = false;
  editingTemplate.value = null;
}

function onAddTemplate(draft: TemplateDraft) {
  if (editingTemplate.value) {
    // 修改已有模板
    editingTemplate.value.info = { ...draft.info };
    editingTemplate.value.data = draft.data;
  } else {
    customTemplates.value.push({
      id: `custom-${Date.now()}`,
      info: draft.info,
      data: draft.data,
      custom: true,
    });
  }
  saveCustom();
  closeImport();
}

function removeTemplate(template: TemplateItem) {
  // 删除前先确认
  pendingDelete.value = template;
}

function confirmDelete() {
  const template = pendingDelete.value;
  if (!template) return;
  customTemplates.value = customTemplates.value.filter(
    (item) => item.id !== template.id
  );
  saveCustom();
  pendingDelete.value = null;
}

function importItemplate(jsonStr: string) {
  if (!render.value) return;
  // 读取为 json 文本（模板数据本身已是一个整体分组）
  render.value.importExportTool.import(jsonStr);
  emit("close");
}
function confirmUseTemplate(index: number) {
  importItemplate(JSON.stringify(templates.value[index].data));
}
</script>

<style scoped></style>

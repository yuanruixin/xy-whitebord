<template>
  <div
    class="template-wrapper grid grid-cols-[min-content_min-content_min-content] justify-between select-none"
  >
    <div
      v-for="(template, index) in templates"
      :key="template.info.title + index"
      class="cursor-pointer rounded-md"
    >
      <div class="template-item">
        <div
          class="item-show relative h-max group w-max overflow-hidden shadow-md hover:ring-2 transition duration-300 ease-in-out"
          :value="index"
        >
          <div class="template-bg p-6 bg-white">
            <img :src="template.info.cover" class="w-52 h-36 object-cover" />
          </div>
          <div
            class="template-actions absolute flex flex-col top-0 h-full p-6 translate-y-full group-hover:translate-y-0 group-hover:bg-white transition duration-200 ease-in-out"
          >
            <div>{{ template.info.description }}</div>
            <div class="ml-auto mt-auto">
              <button
                class="flex items-center h-6 rounded-md bg-[#4e95ff] text-white p-4"
                @click="confirmUseTemplate(index)"
              >
                使用
              </button>
            </div>
          </div>
        </div>
        <div class="item-title mt-2">
          <span class="font-bold">{{ template.info.title }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRenderStore } from "@/store/render";
const { render } = useRenderStore();
import arrowTemplate from "./templates/arrow.json";
import rabbitTemplate from "./templates/rabbit.json";
import { onMounted,ref } from "vue";

const emit = defineEmits<{
  (e: "close"): void;
}>();

interface TemplateItem {
  info: {
    title: string;
    description: string;
    category: string;
    cover: string;
  };
  data: object;
}

const templates = ref<TemplateItem[]>([]);
onMounted(() => {
  templates.value=[arrowTemplate, rabbitTemplate].map((item) => {
    return {
      info: {
        ...item.info,
        cover: getURL(item.info.cover),
      },
      data: item.data,
    };
  });
});

function getURL(name: string) {
  return new URL(`./templates/covers/${name}`, import.meta.url).href;
}

function importItemplate(jsonStr: string) {
  if (!render.value) return;
  // 读取为 json 文本，模板整体作为一个分组导入
  render.value!.importExportTool.import(jsonStr, false, true);
  emit("close");
}
function confirmUseTemplate(index: number) {
  importItemplate(JSON.stringify(templates.value[index].data));
}
</script>

<style scoped></style>

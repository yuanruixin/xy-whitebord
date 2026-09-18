<template>
  <div ref="rootRef" class="relative">
    <div class="relative">
      <input
        ref="inputRef"
        :value="query"
        :placeholder="placeholder"
        type="text"
        autocomplete="off"
        class="w-full rounded-md border border-slate-200 px-2 py-1.5 pr-7 text-sm outline-none focus:border-primary"
        @input="onInput"
        @focus="openList"
        @click="openList"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="onEnter"
        @keydown.esc="closeList(true)"
        @blur="closeList()"
      />
      <button
        type="button"
        tabindex="-1"
        class="absolute right-1 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-slate-400 hover:bg-slate-100"
        @mousedown.prevent
        @click="toggle"
      >
        <span class="icon-[mdi--chevron-down]"></span>
      </button>
    </div>

    <div
      v-if="isOpen && options.length > 0"
      class="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg"
    >
      <button
        v-for="(option, index) in options"
        :key="option"
        type="button"
        class="block w-full truncate px-2 py-1.5 text-left text-sm text-slate-700"
        :class="index === highlighted ? 'bg-slate-100' : ''"
        @mousedown.prevent="select(option)"
        @mouseenter="highlighted = index"
      >
        {{ option }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{
  modelValue: string;
  options: string[];
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const rootRef = ref<HTMLDivElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const query = ref(props.modelValue);
const isOpen = ref(false);
const highlighted = ref(-1);

// 不做过滤：始终展示全部选项，仅高亮当前选中项
const options = computed(() => props.options);

watch(
  () => props.modelValue,
  (value) => {
    if (value !== query.value) query.value = value;
  }
);

function openList() {
  isOpen.value = true;
  // 打开时高亮当前已有取值（存在于列表中时）
  highlighted.value = options.value.findIndex(
    (option) => option === query.value
  );
}

function closeList(revert = false) {
  isOpen.value = false;
  highlighted.value = -1;
  if (revert) query.value = props.modelValue;
}

function toggle() {
  if (isOpen.value) {
    closeList();
  } else {
    inputRef.value?.focus();
    openList();
  }
}

function onInput(event: Event) {
  query.value = (event.target as HTMLInputElement).value;
  highlighted.value = -1;
  isOpen.value = true;
  emit("update:modelValue", query.value);
}

function move(step: number) {
  if (!isOpen.value) {
    openList();
    return;
  }
  const length = options.value.length;
  if (length === 0) return;
  highlighted.value = (highlighted.value + step + length) % length;
}

function select(option: string) {
  query.value = option;
  emit("update:modelValue", option);
  closeList();
  inputRef.value?.blur();
}

function onEnter() {
  const option = options.value[highlighted.value];
  if (isOpen.value && option) {
    select(option);
  } else {
    emit("update:modelValue", query.value);
    closeList();
  }
}

function onDocumentMousedown(event: MouseEvent) {
  if (!rootRef.value?.contains(event.target as Node)) closeList();
}

onMounted(() => document.addEventListener("mousedown", onDocumentMousedown));
onBeforeUnmount(() =>
  document.removeEventListener("mousedown", onDocumentMousedown)
);
</script>

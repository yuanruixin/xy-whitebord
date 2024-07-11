<template>
  <div class="export-menu flex flex-col  gap-y-2 select-none">
    <div class="export-option flex w-80 gap-x-4">
      <span class="w-[84px]">导出格式</span>
      <RadioGroup v-model="exportType" class="flex flex-col gap-y-2">
        <RadioGroupOption
          v-slot="{ checked }"
          v-for="type in exportTypes"
          :key="type.id"
          :value="type"
        >
          <div class="cursor-pointer flex items-center gap-x-1">
            <div
              class="size-4 rounded-full"
              :class="[checked ? 'border-4 border-blue-400' : 'border-2']"
            />
            <label>{{ type.tip }}</label>
          </div>
        </RadioGroupOption>
      </RadioGroup>
    </div>
    <div class="export-option flex w-80 gap-x-4">
      <span class="w-[84px] flex items-center">背景</span>
      <Combobox v-model="selectedBgOption" class="relative">
        <div class="absolute mt-1">
          <div
            class="relative w-[80px] cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm"
          >
            <div
              class="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
            >
              {{ selectedBgOption.tip }}
            </div>
            <ComboboxButton
              class="absolute inset-y-0 right-0 flex items-center pr-2"
            >
              <span
                class="icon-[system-uicons--chevron-open] h-5 w-5 text-gray-400"
                aria-hidden="true"
              ></span>
            </ComboboxButton>
          </div>
          <TransitionRoot
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ComboboxOptions
              class="absolute mt-1 max-h-60 w-fit  rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
            >
              <ComboboxOption
                v-for="bgOption in exportBgOptions"
                as="template"
                :key="bgOption.id"
                :value="bgOption"
                v-slot="{ selected, active }"
              >
                <li
                  class="relative cursor-default select-none py-2 pl-10 pr-4"
                  :class="{
                    'bg-teal-600 text-white': active,
                    'text-gray-900': !active,
                  }"
                >
                  <span
                    class="block truncate"
                    :class="{
                      'font-medium': selected,
                      'font-normal': !selected,
                    }"
                  >
                    {{ bgOption.tip }}
                  </span>
                  <span
                    class="absolute inset-y-0 left-0 flex items-center pl-3"
                    :class="{
                      'text-white': active,
                      'text-teal-600': !active,
                    }"
                  >
                  <SvgIcon prefix="export" :name="bgOption.name"></SvgIcon>
                  </span>
                </li>
              </ComboboxOption>
            </ComboboxOptions>
          </TransitionRoot>
        </div>
      </Combobox>
    </div>
    <div class="mt-16 ml-auto w-fit">
      <button
        type="button"
        class="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        @click="confirmExport"
      >
        导出文件
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed,watch } from "vue";
import {
  TransitionRoot,
  RadioGroup,
  RadioGroupOption,
  Combobox,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/vue";
import SvgIcon from "../SvgIcon/SvgIcon.vue";
const emit = defineEmits<{
  (
    e: "confirm",
    data: { type: ExportType["name"]; bg: ExportBgOption["name"] }
  ): void;
}>();

interface ExportType {
  id: number;
  name: "png" | "jpeg";
  tip: string;
}
const exportTypes: ExportType[] = [
  { id: 1, name: "png", tip: "PNG" },
  { id: 2, name: "jpeg", tip: "JPG" },
];
const exportType = ref<ExportType>(exportTypes[0]);
watch(()=>exportType.value,(val)=>{
  // jpeg是不存在透明背景
  if(val.name==='jpeg'){
    selectedBgOption.value=exportBgOptions.value[1]
  }else{
    selectedBgOption.value=exportBgOptions.value[0]
  }
})

interface ExportBgOption {
  id: number;
  name: "grid" | "transparent" | "white";
  tip: string;
}
const exportBgOptions = computed(() => {
  const defaultOptions: ExportBgOption[] = [
    { id: 1, name: "transparent", tip: "透明" },
    { id: 2, name: "white", tip: "白色" },
    { id: 3, name: "grid", tip: "网格" },
  ];
  if (exportType.value.name === "png") {
    return defaultOptions;
  } else {
    return defaultOptions.slice(1);
  }
});
const selectedBgOption = ref(exportBgOptions.value[0]);

function confirmExport() {
  emit("confirm", {
    type: exportType.value.name,
    bg: selectedBgOption.value.name,
  });
}
</script>

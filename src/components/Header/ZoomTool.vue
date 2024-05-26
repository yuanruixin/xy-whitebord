<template>
  <div
    class="flex items-center h-min select-none rounded-md border-solid border-2 border-slate-600/10"
  >
    <button
      class="text-xl grid place-items-center size-7 hover:bg-slate-600/10"
      @click="decreaseScale"
    >
      -
    </button>
    <div
      class="h-full border-solid border-x-2 border-slate-800/10 hover:bg-slate-600/10"
    >
      <Listbox v-model="realScalePercent" v-slot="{ open }">
        <div class="relative h-7 px-2">
          <ListboxButton
            class="h-full flex items-center cursor-default rounded-lg"
          >
            <span class="flex items-center"
              >{{ showChangeScale.toFixed(0) }}%
              <span
                v-show="open"
                class="icon-[octicon--chevron-down-24]"
              ></span>
              <span v-show="!open" class="icon-[octicon--chevron-up-24]"></span>
            </span>
          </ListboxButton>

          <transition
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <ListboxOptions
              class="absolute z-20 mt-1 max-h-60 w-[160px] right-1/2 translate-x-1/2 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
            >
              <ListboxOption
                v-slot="{ active, selected }"
                v-for="option in scaleOption"
                :key="option"
                :value="option"
                as="template"
              >
                <li
                  class="flex leading-8 px-2"
                  :class="[
                    active ? 'bg-slate-100' : 'text-gray-900',
                    'relative cursor-default select-none px-2',
                  ]"
                  @click="realScalePercent = option"
                >
                  <span
                    :class="[
                      selected ? 'font-medium' : 'font-normal',
                      'block truncate',
                    ]"
                    >{{ option }}%</span
                  >
                </li>
              </ListboxOption>
            </ListboxOptions>
          </transition>
        </div>
      </Listbox>
    </div>
    <button
      class="text-xl grid place-items-center size-7 hover:bg-slate-600/10 active:bg-slate-600/8"
      @click="increaseScale"
    >
      +
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import { defineRenderStore } from "@/store/render";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/vue";
import { useNumChange } from "@/hooks/anime/useNumChange";
const renderStore = defineRenderStore();

const scaleOption = [25, 50, 100, 200, 400];
const realScalePercent = ref(100);

const availableScales = [10, 20, 33, 75, 100, 125, 150, 250, 300, 400];
function decreaseScale() {
  for (let i = availableScales.length - 1; i >= 0; i--) {
    if (realScalePercent.value > availableScales[i]) {
      realScalePercent.value = availableScales[i];
      break;
    }
  }
  setStageScale(realScalePercent.value);
  return;
}
function increaseScale() {
  for (let i = 0; i < availableScales.length; i++) {
    if (realScalePercent.value < availableScales[i]) {
      realScalePercent.value = availableScales[i];
      break;
    }
  }
  setStageScale(realScalePercent.value);
  return;
}
function setStageScale(scale: number) {
  renderStore.render?.stage.scale({
    x: scale / 100,
    y: scale / 100,
  });
  renderStore.render?.draws.bg.draw();
}

// 用于缩放比变化过程的显示
const { number: showChangeScale, setValue: setChangedScale } =
  useNumChange(100);
watch(
  () => realScalePercent.value,
  (newValue) => {
    setChangedScale(newValue);
    setStageScale(realScalePercent.value);
  }
);

// 监听滚轮缩放事件，更新真实值 和 用于显示变化的值
function changeScaleWhenWheelEvent() {
  const scale = renderStore.render?.getStageState().scale ?? 1;
  realScalePercent.value = scale * 100;
  showChangeScale.value = scale * 100;
}
onMounted(() => {
  window.addEventListener("wheel", changeScaleWhenWheelEvent);
});
onUnmounted(() => {
  window.removeEventListener("wheel", changeScaleWhenWheelEvent);
});
</script>

<style scoped></style>

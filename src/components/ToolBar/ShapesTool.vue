<template>
  <Popover
    class="relative flex items-center justify-center rounded-sm overflow-hidden"
  >
    <PopoverButton
      class="focus-visible:outline-none w-full h-full hover:bg-gray-700 rounded-sm overflow-hidden"
      :class="{'bg-primary hover:bg-primary':isActiveTool('createShape')}"
      @click="selectedTool='createShape'"
      v-tooltip="'形状'"
    >
      <svg-icon
        :name="shapes[currentIndex].name"
        :size="36"
        prefix="shapes"
        class=" hover:animate-swing-small focus:outline-none"
      ></svg-icon>
    </PopoverButton>
    <Teleport to="body">
      <PopoverPanel
        v-slot="{ close }"
        class="absolute left-24 top-20 z-100 rounded-md overflow-hidden"
      >
        <RadioGroup
          v-model="currentIndex"
          class="w-max bg-[#1d232a] text-white"
        >
          <div class="grid grid-cols-2 gap-2 p-2">
            <RadioGroupOption
              v-for="(shape, index) in shapes"
              v-slot="{ checked }"
              :value="index"
              :key="index"
            >
              <div
                class="flex justify-center items-center w-10 h-10 hover:bg-gray-700 rounded-md cursor-pointer"
                :class="{ 'bg-primary hover:bg-primary': checked }"
                @click="selectShape(close)"
                v-tooltip="shape.tip"
              >
                <svg-icon
                  prefix="shapes"
                  :name="shape.name"
                  :size="28"
                  class="text-white align-middle"
                />
              </div>
            </RadioGroupOption>
          </div>
        </RadioGroup>
      </PopoverPanel>
    </Teleport>
  </Popover>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  RadioGroup,
  RadioGroupOption,
  PopoverPanel,
  Popover,
  PopoverButton,
} from "@headlessui/vue";
import { useTool } from "./useTool";
import SvgIcon from "@/components/SvgIcon/SvgIcon.vue";
import type { ShapeType } from "@/Render/Element/Shape";
import { useRenderStore } from "@/store/render";
const { render } = useRenderStore();
type Shape = { name: ShapeType; tip: string };
// 当前选中元素，是否激活
const {selectedTool,isActiveTool} = useTool()

// const active = ref(false);
const shapes: Shape[] = [
  {
    name: "arrowRight",
    tip: "向右箭头",
  },
  {
    name: "arrowLeft",
    tip: "向左箭头",
  },
  {
    name: "rectangle",
    tip: "矩形",
  },
  {
    name: "ellipse",
    tip: "圆形",
  },
  {
    name: "diamond",
    tip: "菱形",
  },
  {
    name: "endFile",
    tip: "文件",
  },
  {
    name: "engDatabase",
    tip: "圆柱",
  },
  {
    name: "engQueue",
    tip: "水平圆柱",
  },
  {
    name: "triangleDown",
    tip: "倒三角形",
  },
  {
    name: "triangleUp",
    tip: "三角形",
  },
  {
    name: "parallelogramLeft",
    tip: "左倾平行四边形",
  },
  {
    name: "parallelogramRight",
    tip: "右倾平行四边形",
  },
];
const currentIndex = ref(0);

// const model = defineModel({
//   default: "arrowRight",
// });
function selectShape(close: () => void) {
  setTimeout(() => {
    close();
    render.value?.shape.init({shape:shapes[currentIndex.value].name})
    render.value?.container.addEventListener("click", handleClick);
  }, 100);

  function handleClick() {
    render.value?.container.removeEventListener("click", handleClick);
    selectedTool.value='select'
  }
}
</script>

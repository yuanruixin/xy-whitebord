<template>
  <div
    class="fixed top-16 left-3 flex flex-col w-min pb-1 rounded-md border border-blue text-white bg-[#1d293a]"
  >
    <!-- 主要选择区域 -->
    <ul class="flex flex-col items-center p-2 gap-y-0.5 select-none">
      <!-- 模板 -->
      <li class="cursor-pointer hover:bg-gray-700 rounded-md overflow-hidden">
        <div class="relative flex justify-center p-0 group" :value="0">
          <img
            src="~@/assets/templateHover.svg"
            class="group-hover:animate-swing-small"
          />
          <img
            src="~@/assets/hoverIcon.svg"
            class="absolute top-5 right-0 group-hover:animate-swing-large"
          />
        </div>
      </li>
      <!-- 便签 -->
      <li class="cursor-pointer hover:bg-gray-700 rounded-md overflow-hidden">
        <a class="w-12 h-12 p-0 flex justify-center">
          <svg-icon
            prefix="menu"
            name="sticky"
            :size="48"
            class="hover:animate-swing-small"
          ></svg-icon>
        </a>
      </li>
      <!-- 形状选择工具 -->
      <li class="cursor-pointer rounded-md overflow-hidden">
        <ShapesTool class="w-12 h-12 "></ShapesTool>
      </li>
    </ul>
    <div class="divider m-0 w-3/5 relative left-[20%] h-[1px] bg-slate-400/20"></div>
    <!-- 副功能区 -->
    <MinorTool></MinorTool>

    <div class="divider m-0 w-3/5 relative left-[20%] h-[1px] bg-slate-400/20"></div>
    <!-- 触摸模式(选择、拖拽) -->
    <div class="flex flex-col items-center p-2" @click="toggleStageDragable">
      <span
        class="w-10 h-10 p-0 flex justify-center items-center cursor-pointer rounded-md overflow-hidden"
      >
        <svg-icon
          prefix="menu"
          name="pointer"
          :size="24"
          class="hover:animate-swing-small"
          v-show="!stageDraggable"
        ></svg-icon>
        <svg-icon
          prefix="menu"
          name="hand"
          :size="24"
          v-show="stageDraggable"
          class="hover:animate-swing-small"
        ></svg-icon>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, } from "vue";
import SvgIcon from "@/components/SvgIcon/SvgIcon.vue";
import ShapesTool from "./ShapesTool.vue";
import MinorTool from "./MinorTool.vue";
import { defineRenderStore } from '@/store/render'

const renderStore = defineRenderStore()


const stageDraggable = ref(false);
function toggleStageDragable(){;
  stageDraggable.value=!stageDraggable.value
  renderStore.render?.mouseMode('drag')
}

</script>

<style scoped >
</style>
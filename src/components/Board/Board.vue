<template>
  <div class="h-full">
    <tool-bar class="z-10"></tool-bar>
    <ContextMenu class="h-full" :menuList="menuList">
      <div class="h-full bg-repeat" id="canvasBox" ref="canvasBox" ></div>
    </ContextMenu>
  </div>
</template>

<script setup lang="ts">
import { onMounted,onUnmounted,shallowRef} from "vue";
import ToolBar from "@/components/ToolBar/ToolBar.vue";
import ContextMenu from "@/components/ContextMenu/ContextMenu.vue";
import type { MenuItem } from "@/components/ContextMenu/ContextMenu.vue";
import {defineRenderStore} from '@/store/render'
import {useRender} from './useRender'

const canvasBox = shallowRef<HTMLDivElement | null>(null);

const boardStore = defineRenderStore()
const menuList: MenuItem[] = [
  {
    label: "上移一层",
    callback: () => {},
  },
  {
    label: "下移一层",
    callback: () => {},
  },
  {
    label: "置于顶层",
    callback: () => {},
  },
  {
    label: "置于底层",
    callback: ()=>{
      boardStore.render?.deleteSelectingElement()
    },
  },
  {
    label: "删除",
    callback: () => {
      boardStore.render?.deleteSelectingElement()
    },
  }
];
// 初始化画板

useRender(canvasBox)

onMounted(() => {
 
});
onUnmounted(()=>{
  
})

</script>

<style scoped>

</style>
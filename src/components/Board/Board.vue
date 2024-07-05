<template>
  <div class="h-full">
    <tool-bar class="z-10"></tool-bar>
      <div class="h-full bg-repeat" id="canvasBox" ref="canvasBox" ></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted,onUnmounted,shallowRef} from "vue";
import ToolBar from "@/components/ToolBar/ToolBar.vue";
import {useRender} from './useRender'

const canvasBox = shallowRef<HTMLDivElement | null>(null);

// 初始化画板

useRender(canvasBox)

onMounted(() => {
 
});
onUnmounted(()=>{
  
})

</script>

<style scoped>

</style>
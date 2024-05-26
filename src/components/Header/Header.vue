<template>
  <header
    class="flex items-center h-12 border-b-[1px] border-slate-600/10 px-12 gap-2"
  >
  <!-- tools -->
    <div class="flex items-center justify-center ml-auto">
      <!-- export btn -->
      <div
        class="flex items-center justify-center p-[2px] hover:bg-slate-600/10 rounded-md cursor-pointer"
      >
      
        <span
          class="icon-[ph--export-light] text-2xl font-black select-none"
        ></span>
      </div>
    </div>
    <ZoomTool></ZoomTool>

  </header>
</template>

<script setup lang="ts">
import ZoomTool from "./ZoomTool.vue";


</script>

<style scoped></style>

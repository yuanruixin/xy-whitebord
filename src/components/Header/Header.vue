<template>
  <header
    class="flex items-center h-12 border-b-[1px] border-slate-600/10 px-12 gap-2"
  >
    <!-- tools -->
    <div class="flex items-center justify-center ml-auto">
      <!-- import btn -->
      <div
      class="flex items-center justify-center p-[2px] hover:bg-slate-600/10 rounded-md cursor-pointer"
      @click="onImport"
      >
      <span
      class="icon-[clarity--import-outline-alerted] text-2xl font-black select-none"
      ></span>
    </div>
    
    <!-- export btn -->
      <div
        class="flex items-center justify-center p-[2px] hover:bg-slate-600/10 rounded-md cursor-pointer"
        @click="onSave"
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
import { defineRenderStore } from "@/store/render";

const renderStore = defineRenderStore();

function onSave() {
  if (renderStore.render) {
    const a = document.createElement('a')
    const event = new MouseEvent('click')
    a.download = 'data.json'
    a.href = window.URL.createObjectURL(new Blob([renderStore.render.importExportTool.save()]))
    a.dispatchEvent(event)
    a.remove()
  }
}
function onImport(){
  if (renderStore.render) {
    const input = document.createElement('input')
    // 限制只能选择json文件
    input.accept = '.json'
    input.type = 'file'
    const event = new MouseEvent('click')
    input.dispatchEvent(event)
    input.remove()
    input.onchange = () => {
      const files = input.files
      if (files) {
        let reader = new FileReader()
        reader.onload = function () {
          // 读取为 json 文本
          renderStore.render!.importExportTool.restore(this.result!.toString())
        }
        reader.readAsText(files[0])
      }
    }
  }
}
</script>

<style scoped></style>

<template>
  <div class="relative flex justify-center p-0 group" @click="isOpen = true">
    <img
      src="~@/assets/templateHover.svg"
      class="group-hover:animate-swing-small"
    />
    <img
      src="~@/assets/hoverIcon.svg"
      class="absolute top-5 right-0 group-hover:animate-swing-large"
    />
  </div>
  <Modal v-model="isOpen">
    <div class="flex flex-col w-max gap-y-5">
      <h3 class="text-lg leading-6 text-gray-900 font-bold">选择模板</h3>
      <div
        class="template-main h-[32rem] w-[54rem] p-4 bg-[#f2f4f7] overflow-y-auto"
        @wheel.stop
      >
        <templatesPanel v-if="isOpen" @close="isOpen = false"></templatesPanel>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Modal from "@/components/Modal/Modal.vue";
import templatesPanel from "./templatesPanel.vue";
const isOpen = ref(false);
</script>

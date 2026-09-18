<template>
  <div class="h-full">
    <Board></Board>
    <MainMenu></MainMenu>
    <PropertiesPanel></PropertiesPanel>
    <AISidebar></AISidebar>
  </div>
</template>

<script setup lang="ts">
import Board from "@/components/Board/Board.vue";
import MainMenu from "@/components/Menu/MainMenu.vue";
import PropertiesPanel from "@/components/PropertiesPanel/PropertiesPanel.vue";
import AISidebar from "@/components/AI/AISidebar.vue";
</script>

<style scoped></style>

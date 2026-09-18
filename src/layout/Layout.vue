<template>
  <div class="h-full flex flex-col">
    <Header></Header>
    <main class="flex-1">
        <Board></Board>
    </main>
    <PropertiesPanel></PropertiesPanel>
  </div>
</template>

<script setup lang="ts">
import Header from '@/components/Header/Header.vue'
import Board from '@/components/Board/Board.vue'
import PropertiesPanel from '@/components/PropertiesPanel/PropertiesPanel.vue'
</script>

<style scoped>

</style>
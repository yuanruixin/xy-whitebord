<template>
  <div class="h-full flex flex-col">
    <Header></Header>
    <main class="flex-1">
        <Board></Board>
    </main>
  </div>
</template>

<script setup lang="ts">
import Header from '@/components/Header/Header.vue'
import Board from '@/components/Board/Board.vue'
</script>

<style scoped>

</style>
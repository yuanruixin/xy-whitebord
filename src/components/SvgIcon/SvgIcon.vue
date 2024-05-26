<template>
  <svg aria-hidden="true" :class="['svg-icon', spin && 'svg-icon-spin']">
    <use :xlink:href="symbolId" fill="currentColor" class="svg-use" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  prefix: {
    type: String,
    default: 'menu',
  },
  dir:{
    type:String,
    default:''
  },
  name: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: '',
  },
  size: {
    type: Number,
    default: 20,
  },
  spin: {
    type: Boolean,
    default: false,
  },
})

const symbolId = computed(() => `#icon-${props.prefix}-${props.name}`)
const sizeStyle = computed(()=>props.size+"px")
</script>

<style scoped>
.icon-wrapper {
  display: inline-block;
  position: relative;
}

.svg-icon {
  display: inline-block;
  overflow: hidden;
  width: v-bind(sizeStyle);
  height: v-bind(sizeStyle);
  vertical-align: middle;
  /* 当前元素的color值 */
  fill: currentColor;
}

.svg-icon-spin {
  animation: loadingCircle 0.4s ease-in-out;
}
.svg-use{
  width: 100%;
  height: 100%;
}
.svg-slot {
  position: absolute;
  /* inset: 0; */
  left: 0;
}

/* 旋转动画 */
@keyframes loadingCircle {
  0% {
    transform: rotate(0);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>

<template>
  <div ref="containerRef">
    <slot></slot>
    <Teleport to="body">
      <Transition @enter="onEnter" @leave="onLeave" ref="menuRef">
        <ul
          class="fixed z-50 w-60 py-1 bg-white shadow-md rounded-s select-none "
          v-show="showMenu"
          :style="{ left: x + 'px', top: y + 'px' }"
        >
          <li
            v-for="item in props.menuList"
            class="px-3 cursor-pointer hover:bg-slate-100 active:bg-[#e4e7ec] leading-8"
            @click="item.callback"
          >
            {{ item.label }}
          </li>
        </ul>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { gsap } from "gsap";
import { useContextMenu } from "./useContextMenu";

const containerRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const { x, y, showMenu } = useContextMenu(containerRef,menuRef);

export type MenuItem = {
  label: string;
  callback: () => void;
};
type Props = {
  menuList: MenuItem[];
};
const props = withDefaults(defineProps<Props>(), {
  menuList: () => [
    {
      label: "菜单项1",
      callback: () => {},
    },
    {
      label: "菜单项1",
      callback: () => {},
    },
  ],
});

// 动画
const onEnter = (el: any, done: any) => {
  gsap.fromTo(el, {
    duration: 0.2,
    opacity:0,
    onComplete: done,
  },{
    duration: 0.2,
    opacity:1,
    onComplete: done,
  });
};
const onLeave = (el: any, done: any) => {
  gsap.to(el, {
    duration: 0.2,
    opacity:0,
    onComplete: done,
  });
};

</script>


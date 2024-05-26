import gsap from "gsap";
import { onMounted, onUnmounted } from "vue";

export const useXXX = (el: HTMLElement) => {
  let ctx: gsap.Context;

  onMounted(()=>{
    ctx = gsap.context(() => {
      gsap.to(el, {});
    });
  })
  onUnmounted(() => {
    // 元素恢复原状
    ctx.revert();
  });
  return {};
};

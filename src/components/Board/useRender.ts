import { onMounted, onUnmounted ,Ref} from "vue";
import { defineRenderStore } from "@/store/render";
import { Render } from "@/Render";

export const useRender = (container: Ref<HTMLDivElement|null>) => {
  const boardStore = defineRenderStore();

  const defaultEventHandle = {
    preventDefaultEvent(e: Event) {
      e.preventDefault();
    },
    addEventListeners() {
      window.addEventListener("contextmenu", this.preventDefaultEvent);
      window.addEventListener("wheel", this.preventDefaultEvent, {
        passive: false,
      });
    },
    removeEventListeners() {
      // window.removeEventListener("contextmenu", this.preventDefaultEvent);
      window.removeEventListener("wheel", this.preventDefaultEvent);
    },
  };

  onMounted(() => {
    defaultEventHandle.addEventListeners();
    const board = new Render(container.value!, {showBg:true});
    boardStore.render = board;
  });
  onUnmounted(() => {
    defaultEventHandle.removeEventListeners();
  });
  return {};
};

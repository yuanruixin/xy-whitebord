import gsap from "gsap";
import { ref ,onUnmounted} from "vue";

export const useNumChange = (initValue: number) => {
  const number = ref(initValue);
  let ctx: gsap.Context | null = null
  const setValue = (newValue: number) => {
   if(number.value===newValue) return
   ctx = gsap.context(() => {
    gsap.to(number, {
      duration: 0.4,
      ease: "none",
      value: newValue,
    });
    })
  };
  onUnmounted(()=>{
    ctx?.revert && ctx.revert()
  })
  return {
    number,
    setValue,
  };
};

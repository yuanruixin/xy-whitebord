import { defineStore } from "pinia";
import { Render } from "@/Render";
type BoardState = {
  render: Render | null;
};
export const defineRenderStore = defineStore("Board", {
  
  state: (): BoardState => {
    return {
      render: null,
      
    };
  },
  getters: {
    // 光标控制
    cursor: (state) => state.render?.cursor
  },                 
  actions: {
    
  },
});

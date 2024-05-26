import { ref, Ref, onMounted, onUnmounted, nextTick } from "vue";
export function useContextMenu(containerRef: Ref, menuRef: Ref) {
  const showMenu = ref(false);
  const x = ref(0);
  const y = ref(0);

  const menuSize = ref({
    height: 50,
    width: 100,
  });
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showMenu.value = true;
    // 菜单位置自动调整
    nextTick(()=>{
      menuSize.value = computedMenuSize(menuRef.value as HTMLElement); 
      const menuPostion = computePostion(
        { x: e.clientX, y: e.clientY },
        menuSize.value
      );
      x.value = menuPostion.x;
      y.value = menuPostion.y;
    })
  };
  function closeMenu() {
    showMenu.value = false;
  }
  onMounted(() => {
    const div = containerRef.value as HTMLElement;

    if (!div || !div.addEventListener) return;
    div.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("click", closeMenu, true);
    window.addEventListener("contextmenu", closeMenu, true);
  });
  onUnmounted(() => {
    const div = containerRef.value as HTMLElement;
    if (!div || !div.removeEventListener) return;
    div.removeEventListener("contextmenu", handleContextMenu);
    window.removeEventListener("click", closeMenu, true);
    window.removeEventListener("contextmenu", closeMenu, true);
  });
  function computedMenuSize(menu: HTMLElement) {
    if (!menu) return { height: 50, width: 100 };
    return {
      width: menu.offsetWidth,
      height: menu.offsetHeight,
    };
  }
  function computePostion(
    click: { x: number; y: number },
    menu: {
      height: number;
      width: number;
    }
  ) {
    // 默认返回点击位置
    const result = click;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    if (click.x + menu.width > viewportWidth)
      result.x = click.x - menu.width -10; //增加一些缓冲
    if (click.y + menu.height > viewportHeight)
      result.y = click.y - menu.height - 10; //增加一些缓冲
    return result;
  }
  return {
    showMenu,
    x,
    y,
  };
}

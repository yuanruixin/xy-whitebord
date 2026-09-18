import type { Directive, DirectiveBinding } from "vue";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

export interface TooltipOptions {
  content: string;
  placement?: TooltipPlacement;
  /** 显示延迟（毫秒） */
  delay?: number;
  /** 与目标元素的间距（像素） */
  offset?: number;
}

export type TooltipValue = string | TooltipOptions;

type NormalizedOptions = Required<TooltipOptions>;

// 全局复用一个 tooltip 节点，避免每个元素都创建 DOM
let tipEl: HTMLDivElement | null = null;
let showTimer: number | undefined;

function getTipEl(): HTMLDivElement {
  if (!tipEl) {
    tipEl = document.createElement("div");
    tipEl.className = "xy-tooltip";
    document.body.appendChild(tipEl);
  }
  return tipEl;
}

function normalize(value: TooltipValue): NormalizedOptions {
  if (typeof value === "string") {
    return { content: value, placement: "top", delay: 120, offset: 8 };
  }
  return {
    content: value?.content ?? "",
    placement: value?.placement ?? "top",
    delay: value?.delay ?? 120,
    offset: value?.offset ?? 8,
  };
}

function place(target: HTMLElement, options: NormalizedOptions) {
  const el = getTipEl();
  el.textContent = options.content;

  // 此时元素虽不可见，但已完成布局，可安全测量
  const tipRect = el.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  const { placement, offset } = options;

  let top = 0;
  let left = 0;
  switch (placement) {
    case "bottom":
      top = rect.bottom + offset;
      left = rect.left + rect.width / 2 - tipRect.width / 2;
      break;
    case "left":
      top = rect.top + rect.height / 2 - tipRect.height / 2;
      left = rect.left - tipRect.width - offset;
      break;
    case "right":
      top = rect.top + rect.height / 2 - tipRect.height / 2;
      left = rect.right + offset;
      break;
    default:
      top = rect.top - tipRect.height - offset;
      left = rect.left + rect.width / 2 - tipRect.width / 2;
  }

  // 视口边界修正
  const margin = 4;
  left = Math.min(
    Math.max(left, margin),
    window.innerWidth - tipRect.width - margin
  );
  top = Math.min(
    Math.max(top, margin),
    window.innerHeight - tipRect.height - margin
  );

  el.style.left = `${Math.round(left)}px`;
  el.style.top = `${Math.round(top)}px`;
  el.classList.add("is-visible");
}

function show(target: HTMLElement, options: NormalizedOptions) {
  if (!options.content) return;
  window.clearTimeout(showTimer);
  showTimer = window.setTimeout(() => place(target, options), options.delay);
}

function hide() {
  window.clearTimeout(showTimer);
  tipEl?.classList.remove("is-visible");
}

// 页面滚动/缩放时隐藏，避免位置错乱
if (typeof window !== "undefined") {
  window.addEventListener("scroll", hide, true);
  window.addEventListener("resize", hide);
}

interface Attach {
  onEnter: () => void;
  onLeave: () => void;
}

const attached = new WeakMap<HTMLElement, Attach>();
const optionCache = new WeakMap<HTMLElement, NormalizedOptions>();

export const vTooltip: Directive<HTMLElement, TooltipValue> = {
  mounted(el, binding: DirectiveBinding<TooltipValue>) {
    optionCache.set(el, normalize(binding.value));

    const onEnter = () => {
      const options = optionCache.get(el);
      if (options) show(el, options);
    };
    const onLeave = () => hide();

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("mousedown", onLeave);
    el.addEventListener("focusin", onEnter);
    el.addEventListener("focusout", onLeave);

    attached.set(el, { onEnter, onLeave });
  },
  updated(el, binding: DirectiveBinding<TooltipValue>) {
    optionCache.set(el, normalize(binding.value));
  },
  beforeUnmount(el) {
    const a = attached.get(el);
    if (a) {
      el.removeEventListener("mouseenter", a.onEnter);
      el.removeEventListener("mouseleave", a.onLeave);
      el.removeEventListener("mousedown", a.onLeave);
      el.removeEventListener("focusin", a.onEnter);
      el.removeEventListener("focusout", a.onLeave);
    }
    attached.delete(el);
    optionCache.delete(el);
    hide();
  },
};

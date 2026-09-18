import type Konva from "konva";

export type BindTarget = "stage" | "transformer" | "dom";
export type EventCallback = (...args: any[]) => void;

interface BoundEvent {
  ns: string;
  target: BindTarget;
  event: string;
  callback: EventCallback;
}

/**
 * 事件管理器：以命名空间为单位统一绑定与解绑事件，
 * 避免手工拼接事件名、on/off 不匹配导致的事件泄漏。
 */
export class EventManager {
  private bound = new Map<string, BoundEvent[]>();

  constructor(
    private dom: HTMLElement,
    private stage: Konva.Stage,
    private transformer: Konva.Transformer
  ) {}

  private nodeOf(
    target: BindTarget
  ): HTMLElement | Konva.Stage | Konva.Transformer {
    return target === "dom"
      ? this.dom
      : target === "stage"
        ? this.stage
        : this.transformer;
  }

  on(ns: string, target: BindTarget, event: string, callback: EventCallback) {
    const node = this.nodeOf(target);
    if (target === "dom") {
      (node as HTMLElement).addEventListener(
        event,
        callback as EventListener
      );
    } else {
      (node as Konva.Node).on(this.namespaced(event, ns), callback);
    }

    const list = this.bound.get(ns) ?? [];
    list.push({ ns, target, event, callback });
    this.bound.set(ns, list);
  }

  off(ns: string) {
    const list = this.bound.get(ns);
    if (!list) return;

    for (const item of list) {
      const node = this.nodeOf(item.target);
      if (item.target === "dom") {
        (node as HTMLElement).removeEventListener(
          item.event,
          item.callback as EventListener
        );
      } else {
        (node as Konva.Node).off(
          this.namespaced(item.event, item.ns),
          item.callback
        );
      }
    }

    this.bound.delete(ns);
  }

  private namespaced(event: string, ns: string) {
    return event
      .split(/\s+/)
      .map((e) => `${e}.${ns}`)
      .join(" ");
  }
}

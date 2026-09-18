import type { BoardElement, ElementId } from "./types";

export interface ElementDiff {
  added: ElementId[];
  removed: ElementId[];
  updated: ElementId[];
}

// 忽略每次生成都会变化的 versionNonce 与 version，仅比较有意义的内容
function stableStringify(element: BoardElement): string {
  return JSON.stringify(element, (key, value) =>
    key === "versionNonce" || key === "version" ? 0 : value
  );
}

/** 元素内容相等（忽略 version / versionNonce） */
export function elementsEqual(a: BoardElement, b: BoardElement): boolean {
  if (a === b) return true;
  try {
    return stableStringify(a) === stableStringify(b);
  } catch {
    return false;
  }
}

export function indexById(
  elements: BoardElement[]
): Map<ElementId, BoardElement> {
  return new Map(elements.map((element) => [element.id, element]));
}

/** 比较两份元素列表的增删改 */
export function diffElements(
  prev: BoardElement[],
  next: BoardElement[]
): ElementDiff {
  const prevById = indexById(prev);
  const nextById = indexById(next);

  const added: ElementId[] = [];
  const removed: ElementId[] = [];
  const updated: ElementId[] = [];

  for (const [id, element] of nextById) {
    if (!prevById.has(id)) added.push(id);
    else if (!elementsEqual(prevById.get(id)!, element)) updated.push(id);
  }
  for (const id of prevById.keys()) {
    if (!nextById.has(id)) removed.push(id);
  }

  return { added, removed, updated };
}

/**
 * 复用上一份列表中等价元素的引用，使多份历史快照共享未变元素，
 * 从而把「全量快照」退化为按元素增量存储。
 */
export function internElements(
  prev: BoardElement[],
  next: BoardElement[]
): BoardElement[] {
  const prevById = indexById(prev);
  return next.map((element) => {
    const previous = prevById.get(element.id);
    return previous && elementsEqual(previous, element) ? previous : element;
  });
}

function listsEqual(a: BoardElement[], b: BoardElement[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((element, index) => elementsEqual(element, b[index]));
}

/**
 * 一条历史记录：元素列表 + 当时选中的元素 id。
 * 仅元素变化才会产生新记录；选择随最近一次元素变更一起保存。
 */
export interface HistoryEntry {
  elements: BoardElement[];
  selectedIds: ElementId[];
}

/**
 * 场景历史栈。存储元素列表，并对未变元素做引用复用；
 * 撤销 / 重做返回目标记录，由渲染层负责应用。
 */
export class SceneHistory {
  static readonly DEFAULT_LIMIT = 100;

  private entries: HistoryEntry[] = [];
  private cursor = -1;
  private readonly limit: number;

  constructor(limit: number = SceneHistory.DEFAULT_LIMIT) {
    this.limit = Math.max(1, limit);
  }

  get size(): number {
    return this.entries.length;
  }

  get index(): number {
    return this.cursor;
  }

  get canUndo(): boolean {
    return this.cursor > 0;
  }

  get canRedo(): boolean {
    return this.cursor < this.entries.length - 1;
  }

  get current(): HistoryEntry | null {
    return this.entries[this.cursor] ?? null;
  }

  /** 记录一份新状态；元素与当前等价时不产生新条目。返回是否真正记录 */
  record(elements: BoardElement[], selectedIds: ElementId[] = []): boolean {
    const current = this.current;
    const interned = current
      ? internElements(current.elements, elements)
      : elements;

    if (current && listsEqual(current.elements, interned)) {
      return false;
    }

    // 丢弃重做分支
    this.entries.splice(this.cursor + 1);
    this.entries.push({ elements: interned, selectedIds: [...selectedIds] });

    // 超出上限时丢弃最旧的记录
    if (this.entries.length > this.limit) {
      this.entries.splice(0, this.entries.length - this.limit);
    }
    this.cursor = this.entries.length - 1;
    return true;
  }

  /** 以给定状态重置历史 */
  reset(elements: BoardElement[], selectedIds: ElementId[] = []) {
    this.entries = [{ elements, selectedIds: [...selectedIds] }];
    this.cursor = 0;
  }

  undo(): HistoryEntry | null {
    if (!this.canUndo) return null;
    this.cursor--;
    return this.entries[this.cursor];
  }

  redo(): HistoryEntry | null {
    if (!this.canRedo) return null;
    this.cursor++;
    return this.entries[this.cursor];
  }
}

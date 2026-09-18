import { describe, expect, it } from "vitest";
import { createShapeElement, createTextElement } from "./factory";
import {
  diffElements,
  elementsEqual,
  internElements,
  SceneHistory,
} from "./history";
import type { BoardElement } from "./types";

function shape(id: string, x = 0): BoardElement {
  return createShapeElement({ id, shape: "rectangle", x });
}

describe("element diff / intern", () => {
  it("识别增删改", () => {
    const prev = [shape("a"), shape("b")];
    const next = [shape("a"), shape("b", 50), shape("c")];
    const diff = diffElements(prev, next);
    expect(diff.added).toEqual(["c"]);
    expect(diff.removed).toEqual([]);
    expect(diff.updated).toEqual(["b"]);
  });

  it("复用未变元素引用", () => {
    const prev = [shape("a"), shape("b")];
    const next = [shape("a"), shape("b", 50)];
    const interned = internElements(prev, next);
    expect(interned[0]).toBe(prev[0]);
    expect(interned[1]).not.toBe(prev[1]);
  });

  it("结构相等与引用无关", () => {
    expect(elementsEqual(shape("a"), shape("a"))).toBe(true);
    expect(elementsEqual(shape("a"), shape("a", 1))).toBe(false);
  });
});

describe("SceneHistory", () => {
  it("撤销 / 重做", () => {
    const history = new SceneHistory();
    history.reset([shape("a")]);
    history.record([shape("a"), shape("b")]);
    history.record([shape("a"), shape("b"), shape("c")]);

    expect(history.canUndo).toBe(true);
    expect(history.undo()?.map((e) => e.id)).toEqual(["a", "b"]);
    expect(history.undo()?.map((e) => e.id)).toEqual(["a"]);
    expect(history.undo()).toBeNull();

    expect(history.canRedo).toBe(true);
    expect(history.redo()?.map((e) => e.id)).toEqual(["a", "b"]);
  });

  it("等价的重复记录不会新增条目", () => {
    const history = new SceneHistory();
    history.reset([shape("a")]);
    expect(history.record([shape("a")])).toBe(false);
    expect(history.size).toBe(1);
  });

  it("撤销后再记录会丢弃重做分支", () => {
    const history = new SceneHistory();
    history.reset([shape("a")]);
    history.record([shape("a"), shape("b")]);
    history.undo();
    history.record([shape("a"), createTextElement({ id: "t" })]);

    expect(history.canRedo).toBe(false);
    expect(history.current?.map((e) => e.id)).toEqual(["a", "t"]);
  });

  it("超出上限丢弃最旧记录", () => {
    const history = new SceneHistory(3);
    history.reset([shape("a")]);
    history.record([shape("b")]);
    history.record([shape("c")]);
    history.record([shape("d")]);
    expect(history.size).toBe(3);
    expect(history.index).toBe(2);
  });
});

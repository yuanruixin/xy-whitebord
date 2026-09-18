import { describe, expect, it } from "vitest";
import { matchShortcut } from "./keyboard";

function keyEvent(partial: Partial<KeyboardEvent>): KeyboardEvent {
  return {
    code: "",
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    ...partial,
  } as KeyboardEvent;
}

describe("matchShortcut", () => {
  it("Ctrl 或 Cmd 均可命中", () => {
    const spec = { code: "KeyC", ctrlOrMeta: true } as const;
    expect(matchShortcut(keyEvent({ code: "KeyC", ctrlKey: true }), spec)).toBe(
      true
    );
    expect(matchShortcut(keyEvent({ code: "KeyC", metaKey: true }), spec)).toBe(
      true
    );
  });

  it("缺少修饰键时不命中", () => {
    expect(
      matchShortcut(keyEvent({ code: "KeyC" }), {
        code: "KeyC",
        ctrlOrMeta: true,
      })
    ).toBe(false);
  });

  it("区分 Shift（成组 / 解组）", () => {
    expect(
      matchShortcut(keyEvent({ code: "KeyG", ctrlKey: true }), {
        code: "KeyG",
        ctrlOrMeta: true,
      })
    ).toBe(true);
    expect(
      matchShortcut(keyEvent({ code: "KeyG", ctrlKey: true, shiftKey: true }), {
        code: "KeyG",
        ctrlOrMeta: true,
      })
    ).toBe(false);
    expect(
      matchShortcut(keyEvent({ code: "KeyG", ctrlKey: true, shiftKey: true }), {
        code: "KeyG",
        ctrlOrMeta: true,
        shift: true,
      })
    ).toBe(true);
  });

  it("普通键不被 Ctrl 组合命中", () => {
    const spec = { code: "Delete" } as const;
    expect(matchShortcut(keyEvent({ code: "Delete" }), spec)).toBe(true);
    expect(
      matchShortcut(keyEvent({ code: "Delete", ctrlKey: true }), spec)
    ).toBe(false);
  });
});

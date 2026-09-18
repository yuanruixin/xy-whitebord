import { describe, expect, it } from "vitest";
import {
  createGroupElement,
  createShapeElement,
  type GroupElement,
  type ShapeElement,
} from "./index";
import { bumpVersions } from "./version";

describe("bumpVersions", () => {
  it("新元素版本从 1 开始", () => {
    const [element] = bumpVersions(
      [],
      [createShapeElement({ id: "n", shape: "rectangle" })]
    );
    expect(element.version).toBe(1);
  });

  it("内容不变时复用上一份元素（保留版本与 nonce）", () => {
    const previous: ShapeElement = {
      ...createShapeElement({ id: "a", shape: "rectangle" }),
      version: 5,
      versionNonce: 123,
    };
    const next = createShapeElement({ id: "a", shape: "rectangle" });

    const [element] = bumpVersions([previous], [next]);
    expect(element).toBe(previous);
    expect(element.version).toBe(5);
    expect(element.versionNonce).toBe(123);
  });

  it("内容变化时 version + 1 并换新 nonce", () => {
    const previous: ShapeElement = {
      ...createShapeElement({ id: "a", shape: "rectangle", x: 0 }),
      version: 5,
      versionNonce: 123,
    };
    const next = createShapeElement({ id: "a", shape: "rectangle", x: 10 });

    const [element] = bumpVersions([previous], [next]);
    expect(element.version).toBe(6);
    expect(element.versionNonce).not.toBe(123);
    expect((element as ShapeElement).x).toBe(10);
  });

  it("分组：仅变更的子元素递增，未变的子元素复用", () => {
    const childA: ShapeElement = {
      ...createShapeElement({ id: "a", shape: "rectangle", x: 0 }),
      version: 3,
      versionNonce: 1,
    };
    const childB: ShapeElement = {
      ...createShapeElement({ id: "b", shape: "ellipse", x: 0 }),
      version: 7,
      versionNonce: 2,
    };
    const previous: GroupElement = {
      ...createGroupElement({ id: "g", children: [childA, childB] }),
      version: 4,
      versionNonce: 9,
    };

    const next = createGroupElement({
      id: "g",
      children: [
        createShapeElement({ id: "a", shape: "rectangle", x: 0 }),
        createShapeElement({ id: "b", shape: "ellipse", x: 99 }),
      ],
    });

    const [group] = bumpVersions([previous], [next]) as GroupElement[];
    expect(group.version).toBe(5);
    expect(group.children[0]).toBe(childA);
    expect(group.children[1].version).toBe(8);
  });
});

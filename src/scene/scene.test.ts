import { describe, expect, it } from "vitest";
import {
  DEFAULT_SHAPE_FILL,
  DEFAULT_TEXT_FILL,
  createConnectorElement,
  createShapeElement,
  createTextElement,
  isShapeType,
  randomVersionNonce,
  shapeTypeOfPath,
  SHAPE_PATHS,
} from "./index";

describe("scene factory", () => {
  it("为形状填充默认值", () => {
    const element = createShapeElement({ shape: "rectangle" });
    expect(element.type).toBe("shape");
    expect(element.shape).toBe("rectangle");
    expect(element.fill).toBe(DEFAULT_SHAPE_FILL);
    expect(element.width).toBe(160);
    expect(element.height).toBe(80);
    expect(element.version).toBe(1);
    expect(element.groupIds).toEqual([]);
    expect(element.opacity).toBe(1);
  });

  it("自定义 path 形状保留 path 数据", () => {
    const element = createShapeElement({ shape: "path", path: "M0 0H10" });
    expect(element.shape).toBe("path");
    expect(element.path).toBe("M0 0H10");
  });

  it("为文本填充默认值", () => {
    const element = createTextElement({});
    expect(element.type).toBe("text");
    expect(element.text).toBe("文本");
    expect(element.fill).toBe(DEFAULT_TEXT_FILL);
  });

  it("连接线按两端点计算包围盒，原点固定在 (0,0)", () => {
    const element = createConnectorElement({
      ends: [
        { offsetX: 0, offsetY: 0, x: 10, y: 20 },
        { offsetX: 0, offsetY: 0, x: 40, y: 90 },
      ],
    });
    expect(element.x).toBe(0);
    expect(element.y).toBe(0);
    expect(element.width).toBe(30);
    expect(element.height).toBe(70);
    expect(element.ends).toHaveLength(2);
  });

  it("生成的 id 唯一", () => {
    const a = createShapeElement({ shape: "ellipse" });
    const b = createShapeElement({ shape: "ellipse" });
    expect(a.id).not.toBe(b.id);
  });

  it("versionNonce 单调递增", () => {
    const a = randomVersionNonce();
    const b = randomVersionNonce();
    expect(b).toBeGreaterThan(a);
  });
});

describe("shape types", () => {
  it("识别内置形状", () => {
    expect(isShapeType("rectangle")).toBe(true);
    expect(isShapeType("not-a-shape")).toBe(false);
  });

  it("可由 path 反查形状类型", () => {
    expect(shapeTypeOfPath(SHAPE_PATHS.rectangle)).toBe("rectangle");
    expect(shapeTypeOfPath("M0 0")).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import Konva from "konva";
import {
  createConnectorElement,
  createGroupElement,
  createImageElement,
  createPaintElement,
  createShapeElement,
  SHAPE_PATHS,
  type BoardElement,
  type ConnectorElement,
  type GroupElement,
  type ImageElement,
  type PaintElement,
  type ShapeElement,
} from "@/scene";
import { elementToKonva } from "./konva";
import { konvaToScene } from "./fromKonva";

function roundTrip(element: BoardElement): BoardElement {
  const scene = konvaToScene([elementToKonva(element)]);
  expect(scene).toHaveLength(1);
  return scene[0];
}

describe("konva adapter round-trip", () => {
  it("形状：位置 / 尺寸 / 类型 / 填充", () => {
    const element = createShapeElement({
      shape: "rectangle",
      x: 30,
      y: 40,
      width: 120,
      height: 60,
      fill: "#123456",
    });
    const back = roundTrip(element) as ShapeElement;
    expect(back.type).toBe("shape");
    expect(back.shape).toBe("rectangle");
    expect(back.fill).toBe("#123456");
    expect(back.x).toBeCloseTo(30);
    expect(back.y).toBeCloseTo(40);
    expect(back.width).toBeCloseTo(120);
    expect(back.height).toBeCloseTo(60);
  });

  it("自定义 path 形状保留 d 数据", () => {
    const element = createShapeElement({
      shape: "path",
      path: "M0 0 H100 V50 H0 Z",
      width: 100,
      height: 50,
    });
    const back = roundTrip(element) as ShapeElement;
    expect(back.shape).toBe("path");
    expect(back.path).toBe("M0 0 H100 V50 H0 Z");
  });

  it("连接线保留端点", () => {
    const element = createConnectorElement({
      ends: [
        { offsetX: 0, offsetY: 0, x: 10, y: 20 },
        { offsetX: 0, offsetY: 0, x: 40, y: 90 },
      ],
    });
    const back = roundTrip(element) as ConnectorElement;
    expect(back.type).toBe("connector");
    expect(back.ends[0].x).toBe(10);
    expect(back.ends[1].y).toBe(90);
  });

  it("画笔保留点序列与样式", () => {
    const element = createPaintElement({
      points: [0, 0, 10, 10, 20, 5],
      stroke: "#ff0000",
      strokeWidth: 3,
    });
    const back = roundTrip(element) as PaintElement;
    expect(back.type).toBe("paint");
    expect(back.points).toEqual([0, 0, 10, 10, 20, 5]);
    expect(back.stroke).toBe("#ff0000");
    expect(back.strokeWidth).toBe(3);
  });

  it("图片保留 src 与尺寸", () => {
    const element = createImageElement({
      src: "data:image/png;base64,AAAA",
      x: 5,
      y: 6,
      width: 50,
      height: 40,
    });
    const back = roundTrip(element) as ImageElement;
    expect(back.type).toBe("image");
    expect(back.src).toBe("data:image/png;base64,AAAA");
    expect(back.width).toBeCloseTo(50);
    expect(back.height).toBeCloseTo(40);
  });

  it("兼容位置写在子节点上的结构（形状工具）", () => {
    // 形状工具：group 在原点，位置写在 Path 上
    const group = new Konva.Group({ id: "s1", name: "shape" });
    group.add(
      new Konva.Path({
        data: SHAPE_PATHS.rectangle,
        fill: "#123456",
        x: 200,
        y: 150,
      })
    );
    const element = konvaToScene([group])[0] as ShapeElement;
    expect(element.x).toBeCloseTo(200);
    expect(element.y).toBeCloseTo(150);

    // 正向转换后位置保持
    const back = konvaToScene([elementToKonva(element)])[0] as ShapeElement;
    expect(back.x).toBeCloseTo(200);
    expect(back.y).toBeCloseTo(150);
  });

  it("分组递归保留子元素", () => {
    const element = createGroupElement({
      x: 100,
      y: 50,
      children: [
        createShapeElement({
          shape: "ellipse",
          x: 10,
          y: 10,
          width: 40,
          height: 40,
        }),
      ],
    });
    const back = roundTrip(element) as GroupElement;
    expect(back.type).toBe("group");
    expect(back.children).toHaveLength(1);
    expect(back.children[0].type).toBe("shape");
  });
});

import { beforeAll, describe, expect, it } from "vitest";
import { legacyKonvaToDocument } from "./legacy";

beforeAll(() => {
  const base = {
    font: "",
    measureText: (t: string) => ({ width: t.length * 8 }),
    getImageData: () => ({ data: [] }),
    createLinearGradient: () => ({ addColorStop() {} }),
  };
  const ctx = new Proxy(base, {
    get(target, prop) {
      if (prop in target) return target[prop as keyof typeof target];
      return () => {};
    },
  });
  // @ts-expect-error 测试用 canvas stub
  HTMLCanvasElement.prototype.getContext = () => ctx;
});

const legacyStage = JSON.stringify({
  attrs: {},
  className: "Stage",
  children: [
    {
      attrs: {},
      className: "Layer",
      children: [
        {
          attrs: { id: "s1", name: "shape" },
          className: "Group",
          children: [
            {
              attrs: {
                data: "M0 0 H256 V256 H0 Z",
                fill: "#4e95ff",
                x: 10,
                y: 20,
              },
              className: "Path",
            },
          ],
        },
      ],
    },
  ],
});

describe("legacyKonvaToDocument", () => {
  it("把旧 Konva JSON 转为版本化文档", () => {
    const document = legacyKonvaToDocument(legacyStage);
    expect(document?.type).toBe("xy-whiteboard");
    expect(document?.elements[0].type).toBe("shape");
  });

  it("非法输入返回 null", () => {
    expect(legacyKonvaToDocument("not json")).toBeNull();
  });
});

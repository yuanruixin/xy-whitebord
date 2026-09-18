import { describe, expect, it } from "vitest";
import { createSceneDocument, createShapeElement, serializeSceneDocument } from "@/scene";
import { konvaJsonToSvg } from "./konvaToSvg";

describe("konvaJsonToSvg", () => {
  it("为版本化文档生成 SVG 封面", () => {
    const document = createSceneDocument([
      createShapeElement({ shape: "rectangle", width: 120, height: 80 }),
    ]);
    const svg = konvaJsonToSvg(serializeSceneDocument(document));
    expect(svg).toContain("data:image/svg+xml");
  });

  it("空输入返回 null", () => {
    expect(konvaJsonToSvg("  ")).toBeNull();
  });

  it("非法输入返回 null", () => {
    expect(konvaJsonToSvg("not json")).toBeNull();
  });
});

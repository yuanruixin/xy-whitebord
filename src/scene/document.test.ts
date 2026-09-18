import { describe, expect, it } from "vitest";
import { createShapeElement } from "./factory";
import {
  createSceneDocument,
  isSceneDocument,
  migrateSceneDocument,
  parseSceneDocument,
  serializeSceneDocument,
} from "./document";
import { SCENE_VERSION, type SceneDocument } from "./types";

describe("scene document", () => {
  it("构造的文档带类型与版本", () => {
    const document = createSceneDocument([
      createShapeElement({ shape: "rectangle" }),
    ]);
    expect(document.type).toBe("xy-whiteboard");
    expect(document.version).toBe(SCENE_VERSION);
    expect(document.elements).toHaveLength(1);
  });

  it("序列化后可解析还原", () => {
    const document = createSceneDocument([
      createShapeElement({ shape: "ellipse", text: "hi" }),
    ]);
    const parsed = parseSceneDocument(serializeSceneDocument(document));
    expect(parsed).not.toBeNull();
    expect(parsed?.elements[0]).toMatchObject({ type: "shape", text: "hi" });
  });

  it("识别文档格式", () => {
    expect(isSceneDocument({ type: "xy-whiteboard", version: 1, elements: [] })).toBe(
      true
    );
    expect(isSceneDocument({ version: 1, elements: [] })).toBe(false);
    expect(isSceneDocument("not-json")).toBe(false);
    expect(isSceneDocument(null)).toBe(false);
  });

  it("非文档输入返回 null（便于回退旧格式）", () => {
    expect(parseSceneDocument('{"attrs":{},"className":"Stage"}')).toBeNull();
    expect(parseSceneDocument("not json")).toBeNull();
  });

  it("拒绝高于当前版本的文档", () => {
    const future: SceneDocument = {
      type: "xy-whiteboard",
      version: SCENE_VERSION + 1,
      elements: [],
    };
    expect(parseSceneDocument(serializeSceneDocument(future))).toBeNull();
    expect(() => migrateSceneDocument(future)).toThrow();
  });
});

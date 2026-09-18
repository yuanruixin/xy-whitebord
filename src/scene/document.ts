import { SCENE_VERSION, type BoardElement, type SceneDocument } from "./types";

/** 由元素列表构造版本化文档 */
export function createSceneDocument(elements: BoardElement[]): SceneDocument {
  return {
    type: "xy-whiteboard",
    version: SCENE_VERSION,
    elements,
  };
}

export function serializeSceneDocument(document: SceneDocument): string {
  return JSON.stringify(document);
}

/** 判断任意值是否为本文档格式 */
export function isSceneDocument(value: unknown): value is SceneDocument {
  if (!value || typeof value !== "object") return false;
  const candidate = value as {
    type?: unknown;
    version?: unknown;
    elements?: unknown;
  };
  return (
    candidate.type === "xy-whiteboard" &&
    typeof candidate.version === "number" &&
    Array.isArray(candidate.elements)
  );
}

/**
 * 把版本化的文档迁移到当前版本。
 * 目前仅有 v1；后续版本在此逐级补迁移逻辑。
 */
export function migrateSceneDocument(document: SceneDocument): SceneDocument {
  if (document.version > SCENE_VERSION) {
    throw new Error(
      `不支持的文档版本：${document.version}，当前最高支持 ${SCENE_VERSION}`
    );
  }
  return document;
}

/**
 * 解析文档。接受字符串或已解析对象；
 * 非本文档格式或解析失败返回 null，便于调用方回退到旧版 Konva JSON。
 */
export function parseSceneDocument(
  input: string | unknown
): SceneDocument | null {
  let raw: unknown = input;
  if (typeof input === "string") {
    try {
      raw = JSON.parse(input);
    } catch {
      return null;
    }
  }
  if (!isSceneDocument(raw)) return null;

  try {
    return migrateSceneDocument(raw);
  } catch {
    return null;
  }
}

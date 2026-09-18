import Konva from "konva";
import { createSceneDocument, type SceneDocument } from "@/scene";
import { konvaToScene } from "./fromKonva";

/**
 * 旧版 Konva JSON -> 版本化文档。
 *
 * 仅用于一次性的本地数据迁移（升级前自动保存的画布、旧版自定义模板）。
 * 正常读写路径不再依赖旧格式。
 */
export function legacyKonvaToDocument(jsonStr: string): SceneDocument | null {
  try {
    const container = document.createElement("div");
    const stage = Konva.Node.create(jsonStr, container);
    const layer = stage.getChildren()[0];
    if (!(layer instanceof Konva.Layer)) return null;

    const elements = konvaToScene(layer.getChildren());
    stage.destroy();
    return createSceneDocument(elements);
  } catch (error) {
    console.warn("旧版数据迁移失败", error);
    return null;
  }
}

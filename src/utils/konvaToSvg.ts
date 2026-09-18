import Konva from "konva";
import { parseSceneDocument } from "@/scene";
import { elementToKonva } from "@/Render/scene/konva";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// 节点自身的变换（translate / rotate / scale / offset）
function localTransform(node: Konva.Node): string {
  const parts: string[] = [];
  const x = node.x();
  const y = node.y();
  const rotation = node.rotation();
  const scaleX = node.scaleX();
  const scaleY = node.scaleY();
  const offsetX = node.offsetX();
  const offsetY = node.offsetY();

  if (x || y) parts.push(`translate(${x} ${y})`);
  if (rotation) parts.push(`rotate(${rotation})`);
  if (scaleX !== 1 || scaleY !== 1) parts.push(`scale(${scaleX} ${scaleY})`);
  if (offsetX || offsetY) parts.push(`translate(${-offsetX} ${-offsetY})`);
  return parts.join(" ");
}

function nodeToSvg(node: Konva.Node, transform: string, out: string[]) {
  const combined = [transform, localTransform(node)].filter(Boolean).join(" ");
  const common = `transform="${combined}" opacity="${node.opacity()}"`;

  if (node instanceof Konva.Path) {
    out.push(
      `<path d="${node.data()}" fill="${node.fill() || "none"}" stroke="${
        node.stroke() || "none"
      }" stroke-width="${node.strokeWidth()}" ${common}/>`
    );
    return;
  }

  if (node instanceof Konva.Text) {
    const text = node.text();
    if (text) {
      out.push(
        `<text x="0" y="${node.fontSize()}" font-size="${node.fontSize()}" font-family="${escapeXml(
          node.fontFamily()
        )}" fill="${node.fill() || "#000"}" ${common}>${escapeXml(text)}</text>`
      );
    }
    return;
  }

  if (node instanceof Konva.Image) {
    const href: unknown = node.getAttr("src") ?? node.getAttr("svgXML");
    if (typeof href === "string" && href) {
      out.push(
        `<image href="${escapeXml(href)}" x="0" y="0" width="${node.width()}" height="${node.height()}" ${common}/>`
      );
    }
    return;
  }

  if (node instanceof Konva.Line) {
    out.push(
      `<polyline points="${node.points().join(" ")}" fill="none" stroke="${
        node.stroke() || "#000"
      }" stroke-width="${node.strokeWidth()}" ${common}/>`
    );
    return;
  }

  if (node instanceof Konva.Rect) {
    out.push(
      `<rect x="0" y="0" width="${node.width()}" height="${node.height()}" fill="${
        node.fill() || "none"
      }" stroke="${node.stroke() || "none"}" stroke-width="${
        node.strokeWidth()
      }" ${common}/>`
    );
    return;
  }

  if (node instanceof Konva.Ellipse) {
    out.push(
      `<ellipse cx="0" cy="0" rx="${node.radiusX()}" ry="${
        node.radiusY()
      }" fill="${node.fill() || "none"}" stroke="${
        node.stroke() || "none"
      }" stroke-width="${node.strokeWidth()}" ${common}/>`
    );
    return;
  }

  // 分组：带着组合后的变换继续遍历子节点
  if (node instanceof Konva.Container) {
    for (const child of node.getChildren()) {
      nodeToSvg(child, combined, out);
    }
  }
}

// 由一组节点生成 SVG data URL
function nodesToSvg(
  nodes: Konva.Node[],
  container: Konva.Container,
  aspect: number,
  padding: number
): string | null {
  // 计算包围盒
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of nodes) {
    const rect = node.getClientRect({ relativeTo: container });
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }
  if (!Number.isFinite(minX) || maxX <= minX || maxY <= minY) return null;

  const parts: string[] = [];
  for (const node of nodes) nodeToSvg(node, "", parts);
  if (parts.length === 0) return null;

  const vh = maxY - minY + padding * 2;
  const vw = Math.max(maxX - minX + padding * 2, vh * aspect);
  const vx = (minX + maxX) / 2 - vw / 2;
  const vy = (minY + maxY) / 2 - vh / 2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}" width="${vw}" height="${vh}">${parts.join(
    ""
  )}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * 把画布导出的 JSON 转成 SVG 预览（用于模板封面）。
 * 支持版本化文档与旧版 Konva JSON；节点类型覆盖 Path / Text / Image / Line / Rect / Ellipse 及分组。
 * 返回 data URL，无法解析时返回 null。
 */
export function konvaJsonToSvg(
  jsonStr: string,
  aspect = 208 / 144,
  padding = 16
): string | null {
  if (!jsonStr.trim()) return null;

  // 新格式：版本化文档，先还原为 Konva 节点（用 Group 作参照，避免依赖画布）
  const sceneDocument = parseSceneDocument(jsonStr);
  if (sceneDocument) {
    const group = new Konva.Group();
    group.add(...sceneDocument.elements.map((element) => elementToKonva(element)));
    try {
      return nodesToSvg(group.getChildren(), group, aspect, padding);
    } catch {
      return null;
    } finally {
      group.destroy();
    }
  }

  // 旧格式：Konva JSON
  let stage: Konva.Stage | null = null;
  try {
    const container = document.createElement("div");
    stage = Konva.Node.create(jsonStr, container) as Konva.Stage;
    const layer = stage.getChildren()[0] as Konva.Layer | undefined;
    if (!layer) return null;
    return nodesToSvg(layer.getChildren(), layer, aspect, padding);
  } catch {
    return null;
  } finally {
    stage?.destroy();
  }
}

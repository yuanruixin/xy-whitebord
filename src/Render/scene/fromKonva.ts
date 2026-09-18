import Konva from "konva";
import { nanoid } from "nanoid";
import { DEFAULT_FONT_SIZE } from "@/constants/fontSize";
import {
  DEFAULT_CONNECTOR_STROKE,
  DEFAULT_SHAPE_FILL,
  DEFAULT_TEXT_FILL,
  randomVersionNonce,
  shapeTypeOfPath,
  type BoardElement,
  type BoardElementBase,
  type ConnectorElement,
  type ConnectorEnd,
  type GroupElement,
  type ImageElement,
  type PaintElement,
  type ShapeElement,
  type TextElement,
} from "@/scene";

type CommonBase = Omit<BoardElementBase, "type">;

function baseOf(
  group: Konva.Group,
  width: number,
  height: number
): CommonBase {
  return {
    id: group.id() || nanoid(),
    x: group.x(),
    y: group.y(),
    width,
    height,
    angle: group.rotation(),
    opacity: group.opacity(),
    version: 1,
    versionNonce: randomVersionNonce(),
    groupIds: [],
  };
}

/**
 * Konva 节点 -> Scene 模型（反向适配）。
 *
 * 与 `elementToKonva` 互为逆过程：把渲染层的图形还原为可序列化的文档元素。
 * 分组以递归结构保留，元素的宽高取其在父容器坐标系下的包围盒。
 */
export function konvaToScene(nodes: Konva.Node[]): BoardElement[] {
  return nodes
    .map(nodeToElement)
    .filter((element): element is BoardElement => element !== null);
}

export function nodeToElement(node: Konva.Node): BoardElement | null {
  if (!(node instanceof Konva.Group)) return null;

  switch (node.name()) {
    case "shape":
      return shapeFromKonva(node);
    case "text":
      return textFromKonva(node);
    case "image":
      return imageFromKonva(node);
    case "paint":
      return paintFromKonva(node);
    case "connector":
      return connectorFromKonva(node);
    case "group":
      return groupFromKonva(node);
    default:
      return null;
  }
}

function shapeFromKonva(group: Konva.Group): ShapeElement | null {
  const path = group.findOne("Path") as Konva.Path | null;
  if (!path) return null;

  const data = path.data();
  const shapeType = shapeTypeOfPath(data);
  const box = path.getClientRect({ relativeTo: group });
  const label = group.findOne(".shape-label") as Konva.Text | null;

  return {
    ...baseOf(group, box.width * group.scaleX(), box.height * group.scaleY()),
    type: "shape",
    shape: shapeType ?? "path",
    path: shapeType ? undefined : data,
    fill: String(path.fill() || DEFAULT_SHAPE_FILL),
    text: label?.text() || undefined,
    fontSize: label?.fontSize() ?? DEFAULT_FONT_SIZE,
  };
}

function textFromKonva(group: Konva.Group): TextElement | null {
  const textNode = group.findOne("Text") as Konva.Text | null;
  if (!textNode) return null;

  const box = textNode.getClientRect({ relativeTo: group });

  return {
    ...baseOf(group, box.width * group.scaleX(), box.height * group.scaleY()),
    type: "text",
    text: textNode.text(),
    fontSize: textNode.fontSize(),
    fill: String(textNode.fill() || DEFAULT_TEXT_FILL),
    fontFamily: textNode.fontFamily(),
  };
}

function imageFromKonva(group: Konva.Group): ImageElement | null {
  const image = group.findOne("Image") as Konva.Image | null;
  if (!image) return null;

  const src = image.getAttr("src");
  const svgXML = image.getAttr("svgXML");

  return {
    ...baseOf(group, image.width() * group.scaleX(), image.height() * group.scaleY()),
    type: "image",
    src: typeof src === "string" ? src : "",
    svgXML: typeof svgXML === "string" ? svgXML : undefined,
  };
}

function paintFromKonva(group: Konva.Group): PaintElement | null {
  const line = group.findOne("Line") as Konva.Line | null;
  if (!line) return null;

  const box = line.getClientRect({ relativeTo: group });
  const dash = line.dash();

  return {
    ...baseOf(group, box.width, box.height),
    type: "paint",
    points: line.points(),
    stroke: String(line.stroke() || "#000000"),
    strokeWidth: line.strokeWidth(),
    dash: dash && dash.length > 0 ? dash : undefined,
    globalCompositeOperation:
      line.globalCompositeOperation() === "destination-out"
        ? "destination-out"
        : "source-over",
  };
}

function connectorFromKonva(group: Konva.Group): ConnectorElement | null {
  const arrow = group.findOne("Arrow") as Konva.Arrow | null;
  if (!arrow) return null;

  const ends = group.getAttr("ends") as [ConnectorEnd, ConnectorEnd] | undefined;
  if (!ends) return null;

  const xs = [ends[0].x, ends[1].x];
  const ys = [ends[0].y, ends[1].y];

  return {
    ...baseOf(group, Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)),
    type: "connector",
    ends,
    stroke: String(arrow.stroke() || DEFAULT_CONNECTOR_STROKE),
    strokeWidth: arrow.strokeWidth(),
  };
}

function groupFromKonva(group: Konva.Group): GroupElement {
  const children = group
    .getChildren()
    .map(nodeToElement)
    .filter((element): element is BoardElement => element !== null);
  const box = group.getClientRect({ relativeTo: group });

  return {
    ...baseOf(group, box.width, box.height),
    type: "group",
    scaleX: group.scaleX(),
    scaleY: group.scaleY(),
    children,
  };
}

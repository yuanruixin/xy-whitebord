import Konva from "konva";
import {
  DEFAULT_TEXT_FILL,
  SHAPE_PATHS,
  type BoardElement,
  type ConnectorElement,
  type GroupElement,
  type ImageElement,
  type PaintElement,
  type ShapeElement,
  type TextElement,
} from "@/scene";
import { layoutShapeLabel } from "./label";

/**
 * Scene 模型 -> Konva 节点。
 *
 * 这里集中定义「文档元素如何呈现」，取代此前散落在各工具类中的节点拼装逻辑。
 * 输出结构与既有约定保持一致（顶层 group 的 name 用于命中与选择）：
 *   shape / text / image / paint / connector / group
 */
export function elementToKonva(element: BoardElement): Konva.Group {
  switch (element.type) {
    case "shape":
      return shapeToKonva(element);
    case "text":
      return textToKonva(element);
    case "image":
      return imageToKonva(element);
    case "paint":
      return paintToKonva(element);
    case "connector":
      return connectorToKonva(element);
    case "group":
      return groupToKonva(element);
    default: {
      const exhaustive: never = element;
      throw new Error(`不支持的画布元素类型: ${JSON.stringify(exhaustive)}`);
    }
  }
}

function shapeToKonva(element: ShapeElement): Konva.Group {
  const group = new Konva.Group({ id: element.id, name: "shape" });
  const data =
    element.shape === "path" ? element.path : SHAPE_PATHS[element.shape];

  if (data) {
    const path = new Konva.Path({ data, fill: element.fill });
    // 按目标宽高缩放 path，并让包围盒左上角对齐到元素 (x, y)
    const box = path.getClientRect();
    const scaleX = element.width / (box.width || 1);
    const scaleY = element.height / (box.height || 1);
    path.setAttrs({
      x: -box.x * scaleX,
      y: -box.y * scaleY,
      scaleX,
      scaleY,
    });
    group.add(path);
  }

  if (element.text) {
    const label = new Konva.Text({
      name: "shape-label",
      text: element.text,
      align: "center",
      fontSize: element.fontSize,
      fill: DEFAULT_TEXT_FILL,
      listening: false,
    });
    group.add(label);
    layoutShapeLabel(group, label);
  }

  group.position({ x: element.x, y: element.y });
  if (element.angle) group.rotation(element.angle);
  group.opacity(element.opacity);

  return group;
}

function textToKonva(element: TextElement): Konva.Group {
  const group = new Konva.Group({ id: element.id, name: "text" });
  const text = new Konva.Text({
    text: element.text,
    fontSize: element.fontSize,
    fill: element.fill,
    fontFamily: element.fontFamily,
  });
  group.add(text);
  group.position({ x: element.x, y: element.y });
  if (element.angle) group.rotation(element.angle);
  group.opacity(element.opacity);
  return group;
}

function imageToKonva(element: ImageElement): Konva.Group {
  const group = new Konva.Group({ id: element.id, name: "image" });
  // 占位画布；实际位图由导入/恢复流程按 attrs.src 异步加载后写入
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(element.width));
  canvas.height = Math.max(1, Math.round(element.height));
  const image = new Konva.Image({
    name: "asset",
    image: canvas,
    width: element.width,
    height: element.height,
  });
  if (element.src) image.setAttr("src", element.src);
  if (element.svgXML) image.setAttr("svgXML", element.svgXML);
  group.add(image);
  group.position({ x: element.x, y: element.y });
  if (element.angle) group.rotation(element.angle);
  group.opacity(element.opacity);
  return group;
}

function paintToKonva(element: PaintElement): Konva.Group {
  const group = new Konva.Group({ id: element.id, name: "paint" });
  const line = new Konva.Line({
    stroke: element.stroke,
    strokeWidth: element.strokeWidth,
    points: element.points,
    lineCap: "round",
    lineJoin: "round",
    dash: element.dash,
    globalCompositeOperation: element.globalCompositeOperation,
  });
  group.add(line);
  group.position({ x: element.x, y: element.y });
  group.opacity(element.opacity);
  return group;
}

function connectorToKonva(element: ConnectorElement): Konva.Group {
  const group = new Konva.Group({ id: element.id, name: "connector" });
  const [start, end] = element.ends;
  const arrow = new Konva.Arrow({
    points: [start.x, start.y, end.x, end.y],
    stroke: element.stroke,
    fill: element.stroke,
    strokeWidth: element.strokeWidth,
    pointerLength: 10,
    pointerWidth: 10,
  });
  group.add(arrow);
  group.setAttr("ends", element.ends);
  group.position({ x: element.x, y: element.y });
  group.opacity(element.opacity);
  return group;
}

function groupToKonva(element: GroupElement): Konva.Group {
  const group = new Konva.Group({ id: element.id, name: "group" });
  for (const child of element.children) {
    group.add(elementToKonva(child));
  }
  group.position({ x: element.x, y: element.y });
  group.scale({ x: element.scaleX, y: element.scaleY });
  if (element.angle) group.rotation(element.angle);
  group.opacity(element.opacity);
  return group;
}

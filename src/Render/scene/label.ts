import Konva from "konva";

/**
 * 让形状内标签居中于图形，并抵消图形缩放，保证字号不随图形缩放变化。
 * 抽为纯函数，供文本编辑与 Scene -> Konva 适配层共用。
 */
export function layoutShapeLabel(
  shapeGroup: Konva.Group,
  label: Konva.Text
): void {
  const shapeNode = shapeGroup.children.find(
    (child) => child.name() !== "shape-label"
  );
  if (!shapeNode) return;

  const box = shapeNode.getClientRect({ relativeTo: shapeGroup });
  const padding = 8;
  const width = Math.max(box.width - padding * 2, 20);
  const scaleX = shapeGroup.scaleX() || 1;
  const scaleY = shapeGroup.scaleY() || 1;

  label.setAttrs({
    // 以图形中心为锚点，配合 offset 保证旋转/缩放时居中
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
    width,
    offsetX: width / 2,
    // 抵消 group 缩放，使字号恒定
    scaleX: 1 / scaleX,
    scaleY: 1 / scaleY,
  });
  // 用文本自身高度垂直居中（不用 verticalAlign，保证与编辑框对齐）
  label.offsetY(label.height() / 2);

  // 标签不撑大图形的包围盒（否则缩小图形时 transformer 尺寸会被标签影响）
  label.getClientRect = () =>
    shapeNode.getClientRect({ relativeTo: shapeGroup });
}

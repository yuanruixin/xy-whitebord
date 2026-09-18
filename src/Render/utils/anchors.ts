// 图形四周的关键连接点。x / y 为相对图形包围盒中心的归一化方向（-1 / 0 / 1）。
export interface Anchor {
  id: string;
  x: -1 | 0 | 1;
  y: -1 | 0 | 1;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

// 上、右、下、左 4 个边中点 + 4 个角，共 8 个锚点
export const ANCHORS: Anchor[] = [
  { id: "top", x: 0, y: -1 },
  { id: "right", x: 1, y: 0 },
  { id: "bottom", x: 0, y: 1 },
  { id: "left", x: -1, y: 0 },
  { id: "top-left", x: -1, y: -1 },
  { id: "top-right", x: 1, y: -1 },
  { id: "bottom-right", x: 1, y: 1 },
  { id: "bottom-left", x: -1, y: 1 },
];

export function getAnchor(id: string): Anchor | undefined {
  return ANCHORS.find((anchor) => anchor.id === id);
}

// 锚点在画布坐标系中的位置
export function anchorPoint(rect: Rect, anchor: Anchor): Point {
  return {
    x: rect.x + (rect.width * (anchor.x + 1)) / 2,
    y: rect.y + (rect.height * (anchor.y + 1)) / 2,
  };
}

// 在两个图形之间挑选距离最近的一对锚点（用于自动连线）
export function nearestAnchorPair(
  a: Rect,
  b: Rect
): { from: Anchor; to: Anchor; fromPoint: Point; toPoint: Point } {
  let best = {
    from: ANCHORS[0],
    to: ANCHORS[0],
    fromPoint: anchorPoint(a, ANCHORS[0]),
    toPoint: anchorPoint(b, ANCHORS[0]),
    distance: Infinity,
  };

  for (const from of ANCHORS) {
    const fromPoint = anchorPoint(a, from);
    for (const to of ANCHORS) {
      const toPoint = anchorPoint(b, to);
      const distance = Math.hypot(fromPoint.x - toPoint.x, fromPoint.y - toPoint.y);
      if (distance < best.distance) {
        best = { from, to, fromPoint, toPoint, distance };
      }
    }
  }

  return {
    from: best.from,
    to: best.to,
    fromPoint: best.fromPoint,
    toPoint: best.toPoint,
  };
}

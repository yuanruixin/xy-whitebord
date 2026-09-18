import type { AIScene, AISceneEdge, AISceneNode, AISceneNodeType } from "./types";

const VALID_TYPES: AISceneNodeType[] = [
  "rectangle",
  "ellipse",
  "diamond",
  "triangle",
  "parallelogram",
  "arrow",
  "path",
  "text",
];

// 常见别名 / 流程图术语 -> 内置图形
const TYPE_ALIASES: Record<string, AISceneNodeType> = {
  rect: "rectangle",
  square: "rectangle",
  box: "rectangle",
  process: "rectangle",
  start: "ellipse",
  end: "ellipse",
  circle: "ellipse",
  oval: "ellipse",
  rhombus: "diamond",
  decision: "diamond",
  condition: "diamond",
  data: "parallelogram",
  line: "arrow",
  edge: "arrow",
  connector: "arrow",
  label: "text",
  svg: "path",
  custom: "path",
};

// 从模型返回内容中提取 JSON（兼容代码块、前后说明文字）
function extractJson(content: string): unknown {
  let text = content.trim();

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("未找到有效的 JSON 内容");
  }

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new Error("JSON 解析失败");
  }
}

function toNumber(value: unknown, fallback: number): number {
  const num = typeof value === "string" ? Number(value) : value;
  return typeof num === "number" && Number.isFinite(num) ? num : fallback;
}

function toPositive(value: unknown, fallback: number): number {
  const num = toNumber(value, fallback);
  return num > 0 ? num : fallback;
}

function normalizeScene(raw: unknown): AIScene {
  if (!raw || typeof raw !== "object") {
    throw new Error("数据格式不正确");
  }

  const source = raw as { nodes?: unknown; edges?: unknown };
  const rawNodes = Array.isArray(source.nodes) ? source.nodes : [];
  const nodes: AISceneNode[] = [];

  rawNodes.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const node = item as Record<string, unknown>;
    const rawType =
      typeof node.type === "string" ? node.type.toLowerCase().trim() : "";
    const type = VALID_TYPES.includes(rawType as AISceneNodeType)
      ? (rawType as AISceneNodeType)
      : TYPE_ALIASES[rawType];
    if (!type) return;

    nodes.push({
      id: typeof node.id === "string" && node.id ? node.id : `n${index}`,
      type,
      x: toNumber(node.x, 120 + (index % 4) * 220),
      y: toNumber(node.y, 120 + Math.floor(index / 4) * 140),
      width: toPositive(node.width, type === "text" ? 200 : 160),
      height: toPositive(node.height, type === "text" ? 30 : 80),
      fill: typeof node.fill === "string" ? node.fill : undefined,
      d: typeof node.d === "string" ? node.d : undefined,
      text: typeof node.text === "string" ? node.text : undefined,
      fontSize: toPositive(node.fontSize, 20),
    });
  });

  if (nodes.length === 0) {
    throw new Error("没有解析到任何图形");
  }

  const ids = new Set(nodes.map((node) => node.id));
  const rawEdges = Array.isArray(source.edges) ? source.edges : [];
  const edges: AISceneEdge[] = [];

  rawEdges.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const edge = item as { from?: unknown; to?: unknown };
    if (typeof edge.from !== "string" || typeof edge.to !== "string") return;
    if (!ids.has(edge.from) || !ids.has(edge.to)) return;
    edges.push({ from: edge.from, to: edge.to });
  });

  return { nodes, edges };
}

// 从已保存的模型输出中解析场景（用于历史对话重新导入）
export function parseScene(content: string): AIScene {
  return normalizeScene(extractJson(content));
}

// 模型未走工具调用、而是直接返回场景 JSON 时的兜底解析
export function tryParseScene(content: string): AIScene | null {
  try {
    return parseScene(content);
  } catch {
    return null;
  }
}

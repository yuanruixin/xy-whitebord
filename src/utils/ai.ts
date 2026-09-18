import type { AIConfig } from "@/store/ai";

// AI 生成的图形类型（对应项目内置形状 + 文本节点）
export type AISceneNodeType =
  | "rectangle"
  | "ellipse"
  | "diamond"
  | "triangle"
  | "parallelogram"
  | "arrow"
  | "text";

export interface AISceneNode {
  id?: string;
  type: AISceneNodeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fill?: string;
  text?: string;
  fontSize?: number;
}

export interface AISceneEdge {
  from: string;
  to: string;
}

export interface AIScene {
  nodes: AISceneNode[];
  edges?: AISceneEdge[];
}

const VALID_TYPES: AISceneNodeType[] = [
  "rectangle",
  "ellipse",
  "diamond",
  "triangle",
  "parallelogram",
  "arrow",
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
};

const SYSTEM_PROMPT = `你是一个图形/白板场景生成助手。请根据用户的描述，输出一个 JSON 对象，用于在无限画布上绘制图形与连接线。
只输出 JSON 本身，不要输出任何解释文字，也不要使用 Markdown 代码块。

JSON 结构：
{
  "nodes": [
    {
      "id": "唯一字符串",
      "type": "rectangle | ellipse | diamond | triangle | parallelogram | arrow | text",
      "x": 数字,
      "y": 数字,
      "width": 数字,
      "height": 数字,
      "fill": "#十六进制颜色",
      "text": "可选，图形内的文字",
      "fontSize": "可选，text 节点的字号，默认 20"
    }
  ],
  "edges": [
    { "from": "起点节点id", "to": "终点节点id" }
  ]
}

规则：
- 画布左上角为原点，建议从 x=120, y=120 开始布局，整体控制在 x:120~1080、y:120~680 范围内。
- 尺寸建议：矩形/菱形 160x80；椭圆 140x100；文字节点 width 约 200。
- 节点之间留出间距：横向间隔建议不小于 60，纵向不小于 80，严禁重叠。
- 流程图建议自上而下或从左到右排列。
- edges 表示带箭头的连接线，from/to 必须是 nodes 中真实存在的 id。
- fill 从配色中选取：#4e95ff(主蓝), #34d399(绿), #fbbf24(黄), #f87171(红), #a78bfa(紫), #94a3b8(灰)。
- 文字节点 type 为 "text" 时，fill 表示文字颜色，建议使用 #1d293a。
- 节点数量控制在 30 个以内。`;

// 从模型返回内容中提取 JSON（兼容代码块、前后说明文字）
function extractJson(content: string): unknown {
  let text = content.trim();

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI 未返回有效的 JSON 内容");
  }

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new Error("AI 返回的 JSON 解析失败");
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
    throw new Error("AI 返回的数据格式不正确");
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
      text: typeof node.text === "string" ? node.text : undefined,
      fontSize: toPositive(node.fontSize, 20),
    });
  });

  if (nodes.length === 0) {
    throw new Error("AI 没有生成任何图形，请换一种描述重试");
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

export type AIStatus =
  | "idle"
  | "connecting"
  | "reasoning"
  | "generating"
  | "parsing";

export interface AIStreamHandlers {
  // 当前阶段，用于给用户过程反馈
  onStatus?: (status: AIStatus) => void;
  // 正文增量（最终会解析为图形 JSON）
  onContent?: (delta: string, full: string) => void;
  // 推理过程增量（部分模型会返回 reasoning_content）
  onReasoning?: (delta: string, full: string) => void;
  signal?: AbortSignal;
}

function validateConfig(config: AIConfig) {
  if (!config.apiKey.trim()) throw new Error("请先配置 API Key");
  if (!config.baseURL.trim()) throw new Error("请先配置 Base URL");
  if (!config.model.trim()) throw new Error("请先配置模型名称");
}

function extractErrorMessage(response: Response): Promise<string> {
  return response
    .json()
    .then((data) => data?.error?.message ?? data?.message ?? "")
    .catch(() => response.text().catch(() => ""));
}

/**
 * 调用 OpenAI 兼容接口（流式），根据自然语言描述生成画布场景。
 * 生成过程中通过 handlers 实时回调文本增量与状态，便于界面展示中间过程。
 */
export async function generateSceneStream(
  prompt: string,
  config: AIConfig,
  handlers: AIStreamHandlers = {}
): Promise<AIScene> {
  validateConfig(config);

  const baseURL = config.baseURL.trim().replace(/\/+$/, "");
  handlers.onStatus?.("connecting");

  let response: Response;
  try {
    response = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey.trim()}`,
      },
      signal: handlers.signal,
      body: JSON.stringify({
        model: config.model.trim(),
        temperature: 0.4,
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
      }),
    });
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw error;
    throw new Error("网络请求失败，请检查 Base URL 与网络连接");
  }

  if (!response.ok) {
    const detail = await extractErrorMessage(response);
    throw new Error(
      `请求失败 (${response.status})${detail ? `：${detail}` : ""}`
    );
  }

  const contentType = response.headers.get("content-type") ?? "";

  // 部分服务商不支持流式，退回一次性解析
  if (!response.body || contentType.includes("application/json")) {
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("接口未返回有效内容");
    }
    handlers.onContent?.(content, content);
    handlers.onStatus?.("parsing");
    return normalizeScene(extractJson(content));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  let reasoning = "";
  let status: AIStatus = "connecting";
  let finished = false;

  const setStatus = (next: AIStatus) => {
    if (status === next) return;
    status = next;
    handlers.onStatus?.(next);
  };

  read: while (!finished) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    while (buffer.includes("\n")) {
      const newlineIndex = buffer.indexOf("\n");
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);

      if (!line || !line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") {
        finished = true;
        break read;
      }

      let chunk: {
        choices?: {
          delta?: { content?: unknown; reasoning_content?: unknown };
        }[];
      };
      try {
        chunk = JSON.parse(payload);
      } catch {
        continue;
      }

      const delta = chunk?.choices?.[0]?.delta;
      if (!delta) continue;

      if (typeof delta.reasoning_content === "string" && delta.reasoning_content) {
        reasoning += delta.reasoning_content;
        setStatus("reasoning");
        handlers.onReasoning?.(delta.reasoning_content, reasoning);
      }

      if (typeof delta.content === "string" && delta.content) {
        content += delta.content;
        setStatus("generating");
        handlers.onContent?.(delta.content, content);
      }
    }
  }

  if (!content.trim()) {
    throw new Error("接口未返回有效内容");
  }

  handlers.onStatus?.("parsing");
  return normalizeScene(extractJson(content));
}

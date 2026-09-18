import type {
  AISceneEdge,
  AISceneNode,
  CanvasExecutor,
  CanvasToolName,
  CanvasToolResult,
  NodeMove,
  NodeUpdate,
} from "./types";

export interface OpenAIToolFunction {
  name: CanvasToolName;
  description: string;
  parameters: Record<string, unknown>;
}

export interface OpenAITool {
  type: "function";
  function: OpenAIToolFunction;
}

const NODE_SCHEMA = {
  type: "object",
  properties: {
    id: {
      type: "string",
      description: "临时引用 id（可选），供本次 edges 或返回结果引用",
    },
    type: {
      type: "string",
      enum: [
        "rectangle",
        "ellipse",
        "diamond",
        "triangle",
        "parallelogram",
        "arrow",
        "path",
        "text",
      ],
      description:
        "图形类型；path 为自定义 SVG 形状（需同时提供 d）",
    },
    x: { type: "number", description: "左上角画布坐标 x" },
    y: { type: "number", description: "左上角画布坐标 y" },
    width: { type: "number", description: "宽度，默认矩形/菱形 160、文本 200" },
    height: { type: "number", description: "高度，默认 80、文本 30" },
    fill: { type: "string", description: "填充色 / 文字颜色（#十六进制）" },
    d: {
      type: "string",
      description:
        'SVG path 数据（d 属性），仅 type="path" 时使用；坐标系会被缩放到 width×height，例如 "M0 0 L100 0 L50 100 Z"',
    },
    text: { type: "string", description: "图形内文字或文本内容" },
    fontSize: { type: "number", description: "字号，默认 20" },
  },
  required: ["type", "x", "y"],
} as const;

const EDGE_SCHEMA = {
  type: "object",
  properties: {
    from: { type: "string", description: "起点节点 id" },
    to: { type: "string", description: "终点节点 id" },
  },
  required: ["from", "to"],
} as const;

/**
 * 暴露给模型的画布工具表（OpenAI function calling 格式）。
 * 与 CanvasExecutor 的方法一一对应。
 */
export const CANVAS_TOOLS: OpenAITool[] = [
  {
    type: "function",
    function: {
      name: "create_nodes",
      description:
        "在画布上批量创建图形或文本节点，可同时建立带箭头的连接线。用于首次绘制或追加内容。一次创建的内容会自动合并为一个分组，结果里的 groupId 可用于整体移动/删除。",
      parameters: {
        type: "object",
        properties: {
          nodes: {
            type: "array",
            items: NODE_SCHEMA,
            description: "要创建的节点列表",
          },
          edges: {
            type: "array",
            items: EDGE_SCHEMA,
            description: "可选连接线，from/to 引用节点 id",
          },
        },
        required: ["nodes"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "connect_nodes",
      description: "为画布上已有节点建立带箭头的连接线。",
      parameters: {
        type: "object",
        properties: {
          edges: {
            type: "array",
            items: EDGE_SCHEMA,
            description: "连接线列表，from/to 为画布节点 id",
          },
        },
        required: ["edges"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "move_nodes",
      description:
        "移动画布上已有节点。可传绝对坐标 x/y，或相对位移 dx/dy；两者都有时以绝对坐标为准。",
      parameters: {
        type: "object",
        properties: {
          moves: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", description: "画布节点 id" },
                x: { type: "number", description: "目标左上角 x（可选）" },
                y: { type: "number", description: "目标左上角 y（可选）" },
                dx: { type: "number", description: "相对位移 x（可选）" },
                dy: { type: "number", description: "相对位移 y（可选）" },
              },
              required: ["id"],
            },
            description: "移动指令列表",
          },
        },
        required: ["moves"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_nodes",
      description: "修改画布上已有节点的文字或颜色。",
      parameters: {
        type: "object",
        properties: {
          updates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", description: "画布节点 id" },
                text: { type: "string", description: "新的文字内容（可选）" },
                fill: {
                  type: "string",
                  description: "新的颜色（可选，图形为填充色、文本为字色）",
                },
              },
              required: ["id"],
            },
            description: "修改指令列表",
          },
        },
        required: ["updates"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_nodes",
      description: "删除画布上已有节点（按 id）。",
      parameters: {
        type: "object",
        properties: {
          ids: {
            type: "array",
            items: { type: "string" },
            description: "要删除的节点 id 列表",
          },
        },
        required: ["ids"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_canvas",
      description:
        "读取当前画布所有元素的 id、类型、文字、位置与尺寸，用于修改前确认目标。",
      parameters: { type: "object", properties: {} },
    },
  },
];

function fail(message: string): CanvasToolResult {
  return { ok: false, message };
}

// 需要用户确认后才执行的工具
export const DANGEROUS_TOOLS: ReadonlySet<CanvasToolName> = new Set([
  "delete_nodes",
]);

export function isDangerousTool(name: string): boolean {
  return DANGEROUS_TOOLS.has(name as CanvasToolName);
}

// 工具调用的中文名，用于 UI 展示与确认提示
export const CANVAS_TOOL_LABELS: Record<CanvasToolName, string> = {
  create_nodes: "创建图形",
  connect_nodes: "连接图形",
  move_nodes: "移动图形",
  update_nodes: "修改图形",
  delete_nodes: "删除图形",
  get_canvas: "读取画布",
};

// 根据工具与参数生成简短的人类可读描述
export function summarizeToolCall(name: string, rawArgs: unknown): string {
  const args = parseToolArgs(rawArgs);
  const label = CANVAS_TOOL_LABELS[name as CanvasToolName] ?? name;
  const count = (value: unknown) => (Array.isArray(value) ? value.length : 0);

  switch (name as CanvasToolName) {
    case "delete_nodes":
      return `删除 ${count(args.ids)} 个图形`;
    case "move_nodes":
      return `移动 ${count(args.moves)} 个图形`;
    case "update_nodes":
      return `修改 ${count(args.updates)} 个图形`;
    case "create_nodes":
      return `创建 ${count(args.nodes)} 个图形`;
    case "connect_nodes":
      return `新增 ${count(args.edges)} 条连接线`;
    default:
      return label;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

// 解析模型给出的参数（流式传输时是字符串）
export function parseToolArgs(raw: unknown): Record<string, unknown> {
  if (isObject(raw)) return raw;
  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return {};
    try {
      const parsed = JSON.parse(text);
      return isObject(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * 把一次工具调用分发到画布能力端口。
 * 负责参数校验与异常兜底，返回可回传给模型的结果。
 */
export function executeToolCall(
  name: string,
  rawArgs: unknown,
  executor: CanvasExecutor
): CanvasToolResult {
  try {
    const args = parseToolArgs(rawArgs);

    switch (name as CanvasToolName) {
      case "create_nodes": {
        const nodes = Array.isArray(args.nodes) ? args.nodes : [];
        if (nodes.length === 0) return fail("nodes 不能为空");
        const edges = Array.isArray(args.edges) ? args.edges : undefined;
        return executor.createNodes({
          nodes: nodes as AISceneNode[],
          edges: edges as AISceneEdge[] | undefined,
        });
      }
      case "connect_nodes": {
        const edges = Array.isArray(args.edges) ? args.edges : [];
        if (edges.length === 0) return fail("edges 不能为空");
        return executor.connectNodes({ edges: edges as AISceneEdge[] });
      }
      case "move_nodes": {
        const moves = Array.isArray(args.moves) ? args.moves : [];
        if (moves.length === 0) return fail("moves 不能为空");
        return executor.moveNodes({ moves: moves as NodeMove[] });
      }
      case "update_nodes": {
        const updates = Array.isArray(args.updates) ? args.updates : [];
        if (updates.length === 0) return fail("updates 不能为空");
        return executor.updateNodes({ updates: updates as NodeUpdate[] });
      }
      case "delete_nodes": {
        const ids = Array.isArray(args.ids) ? args.ids : [];
        if (ids.length === 0) return fail("ids 不能为空");
        return executor.deleteNodes({ ids: ids.map(String) });
      }
      case "get_canvas":
        return executor.getCanvas();
      default:
        return fail(`未知工具：${name}`);
    }
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}

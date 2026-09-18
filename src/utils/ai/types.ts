// AI 模块与画布工具都依赖的类型定义。
// 该文件不依赖 Konva / Vue，保证 AI 模块可以独立复用与测试。
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

// ===== 画布工具入参 =====

export interface CreateNodesArgs {
  nodes: AISceneNode[];
  edges?: AISceneEdge[];
}

export interface NodeMove {
  id: string;
  // 绝对坐标（优先）
  x?: number;
  y?: number;
  // 相对位移（未提供 x / y 时生效）
  dx?: number;
  dy?: number;
}

export interface MoveNodesArgs {
  moves: NodeMove[];
}

export interface DeleteNodesArgs {
  ids: string[];
}

export interface NodeUpdate {
  id: string;
  text?: string;
  fill?: string;
}

export interface UpdateNodesArgs {
  updates: NodeUpdate[];
}

export interface ConnectNodesArgs {
  edges: AISceneEdge[];
}

// ===== 画布工具出参 =====

export interface CanvasNodeInfo {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasSnapshot {
  description: string;
  nodes: CanvasNodeInfo[];
}

export interface CanvasToolResult {
  ok: boolean;
  message: string;
  data?: unknown;
}

/**
 * 画布能力端口：AI 模块只依赖该接口，具体实现（CanvasCommandTool）留在渲染层，
 * 从而把「AI 逻辑」与「Konva / 渲染实现」解耦。新增画布能力时同步扩展该接口与工具表。
 */
export interface CanvasExecutor {
  createNodes(args: CreateNodesArgs): CanvasToolResult;
  moveNodes(args: MoveNodesArgs): CanvasToolResult;
  deleteNodes(args: DeleteNodesArgs): CanvasToolResult;
  updateNodes(args: UpdateNodesArgs): CanvasToolResult;
  connectNodes(args: ConnectNodesArgs): CanvasToolResult;
  getCanvas(): CanvasToolResult;
}

export type CanvasToolName =
  | "create_nodes"
  | "connect_nodes"
  | "move_nodes"
  | "update_nodes"
  | "delete_nodes"
  | "get_canvas";

// ===== 对话 =====

// 一轮对话（发送给模型的历史）
export interface AIChatTurn {
  role: "user" | "assistant";
  content: string;
}

// 模型回复：要么追问/说明，要么已完成若干画布操作
export interface AIToolCallRecord {
  id: string;
  name: string;
  args: unknown;
  result: CanvasToolResult;
}

export interface AIAgentResult {
  // 最终助手文本（追问或结果说明）
  text: string;
  // 模型推理过程
  reasoning: string;
  // 本轮执行过的画布操作
  toolCalls: AIToolCallRecord[];
}

export type AIStatus =
  | "idle"
  | "connecting"
  | "reasoning"
  | "generating"
  | "acting"
  | "parsing";

export interface AIStreamHandlers {
  onStatus?: (status: AIStatus) => void;
  onContent?: (delta: string, full: string) => void;
  onReasoning?: (delta: string, full: string) => void;
  // 每执行完一个画布操作回调，便于 UI 实时展示
  onToolCall?: (record: AIToolCallRecord) => void;
  signal?: AbortSignal;
}

export interface AIAgentOptions {
  // 当前画布已有内容描述，附在 system 提示后用于避免重叠
  canvasContext?: string;
  // 用户当前选中的元素描述，本次提问优先针对它们
  selectionContext?: string;
  // 工具调用最大轮数，避免模型无限调用
  maxSteps?: number;
  // 危险操作（如删除）执行前的确认回调，返回 false 表示拒绝执行
  onConfirm?: (request: ConfirmationRequest) => boolean | Promise<boolean>;
}

// 危险操作确认请求
export interface ConfirmationRequest {
  name: CanvasToolName;
  args: unknown;
  // 简短的人类可读描述，例如“删除 2 个图形”
  summary: string;
}

export type { AIConfig };

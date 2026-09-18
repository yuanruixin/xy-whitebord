import type { AIStatus, AIToolCallRecord, CanvasNodeInfo } from "@/utils/ai";
import { CANVAS_TOOL_LABELS } from "@/utils/ai";

// 空对话时的示例提示
export const EXAMPLE_PROMPTS = [
  "画一个用户登录流程图",
  "用四步说明软件开发流程",
  "画一个简单的思维导图：前端、后端、数据库",
];

export const STATUS_TEXT: Record<AIStatus, string> = {
  idle: "思考中...",
  connecting: "正在连接模型...",
  reasoning: "模型思考中...",
  generating: "正在生成图形...",
  acting: "正在操作画布...",
  parsing: "正在解析并导入画布...",
};

// 画布工具执行结果 -> 展示文案
export function describeToolCall(record: AIToolCallRecord): string {
  const label =
    CANVAS_TOOL_LABELS[record.name as keyof typeof CANVAS_TOOL_LABELS] ??
    record.name;
  return record.result.message || label;
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const sameDay = date.toDateString() === new Date().toDateString();
  const time = date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return sameDay ? time : `${date.getMonth() + 1}-${date.getDate()} ${time}`;
}

// 选中元素 -> 发送给模型的上下文描述
export function buildSelectionText(nodes: CanvasNodeInfo[]): string {
  return [
    "用户在画布上选中了以下元素：",
    ...nodes.map(
      (node) =>
        `- id=${node.id} ${node.type}${
          node.label ? `「${node.label}」` : ""
        }: x=${node.x}, y=${node.y}, w=${node.width}, h=${node.height}`
    ),
  ].join("\n");
}

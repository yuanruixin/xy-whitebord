import type { AIConfig } from "@/store/ai";
import { buildSystemPrompt } from "./prompt";
import {
  CANVAS_TOOLS,
  executeToolCall,
  isDangerousTool,
  summarizeToolCall,
} from "./tools";
import type {
  AIAgentOptions,
  AIAgentResult,
  AIStatus,
  AIStreamHandlers,
  AIToolCallRecord,
  CanvasExecutor,
  CanvasToolName,
  CanvasToolResult,
} from "./types";

interface ChatToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ChatToolCall[];
  tool_call_id?: string;
}

interface StreamStepResult {
  content: string;
  reasoning: string;
  toolCalls: ChatToolCall[];
}

function validateConfig(config: AIConfig) {
  if (!config.apiKey.trim()) throw new Error("请先配置 API Key");
  if (!config.baseURL.trim()) throw new Error("请先配置 Base URL");
  if (!config.model.trim()) throw new Error("请先配置模型名称");
}

/**
 * 构造请求体。根据服务商注入“思考”开关：
 * - DeepSeek：thinking.enabled / disabled
 * - OpenAI o 系列、gpt-5：reasoning_effort
 * 关闭思考可显著减少输出 token、加快生成。
 */
function buildRequestBody(
  config: AIConfig,
  messages: ChatMessage[],
  stream: boolean
) {
  const baseURL = config.baseURL.toLowerCase();
  const model = config.model.toLowerCase();

  const body: Record<string, unknown> = {
    model: config.model.trim(),
    stream,
    messages,
    tools: CANVAS_TOOLS,
    tool_choice: "auto",
  };

  if (config.provider === "deepseek" || baseURL.includes("deepseek")) {
    body.thinking = { type: config.thinking ? "enabled" : "disabled" };
  }

  const isOpenAIReasoning = /^o\d/.test(model) || model.startsWith("gpt-5");
  if (isOpenAIReasoning) {
    body.reasoning_effort = config.thinking ? "high" : "low";
  } else {
    // 推理模型不接受 temperature，普通模型才设置
    body.temperature = 0.4;
  }

  return body;
}

function extractErrorMessage(response: Response): Promise<string> {
  return response
    .json()
    .then((data) => data?.error?.message ?? data?.message ?? "")
    .catch(() => response.text().catch(() => ""));
}

function normalizeToolCalls(raw: unknown): ChatToolCall[] {
  if (!Array.isArray(raw)) return [];
  const calls: ChatToolCall[] = [];
  raw.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const call = item as {
      id?: unknown;
      function?: { name?: unknown; arguments?: unknown };
    };
    const name = typeof call.function?.name === "string" ? call.function.name : "";
    if (!name) return;
    calls.push({
      id: typeof call.id === "string" && call.id ? call.id : `call_${index}`,
      type: "function",
      function: {
        name,
        arguments:
          typeof call.function?.arguments === "string"
            ? call.function.arguments
            : JSON.stringify(call.function?.arguments ?? {}),
      },
    });
  });
  return calls;
}

async function requestChat(
  config: AIConfig,
  messages: ChatMessage[],
  signal: AbortSignal | undefined,
  stream: boolean
): Promise<Response> {
  const baseURL = config.baseURL.trim().replace(/\/+$/, "");
  try {
    return await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey.trim()}`,
      },
      signal,
      body: JSON.stringify(buildRequestBody(config, messages, stream)),
    });
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw error;
    throw new Error("网络请求失败，请检查 Base URL 与网络连接");
  }
}

// 单次模型调用（一次请求），返回文本、推理与工具调用
async function streamStep(
  config: AIConfig,
  messages: ChatMessage[],
  handlers: AIStreamHandlers
): Promise<StreamStepResult> {
  validateConfig(config);
  handlers.onStatus?.("connecting");

  const response = await requestChat(config, messages, handlers.signal, true);

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
    const message = data?.choices?.[0]?.message;
    const content = typeof message?.content === "string" ? message.content : "";
    const toolCalls = normalizeToolCalls(message?.tool_calls);
    if (!content.trim() && toolCalls.length === 0) {
      throw new Error("接口未返回有效内容");
    }
    if (content) handlers.onContent?.(content, content);
    return { content, reasoning: "", toolCalls };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  let reasoning = "";
  let status: AIStatus = "connecting";
  let finished = false;

  const toolAccumulator = new Map<
    number,
    { id: string; name: string; arguments: string }
  >();

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
          delta?: {
            content?: unknown;
            reasoning_content?: unknown;
            tool_calls?: unknown;
          };
        }[];
      };
      try {
        chunk = JSON.parse(payload);
      } catch {
        continue;
      }

      const delta = chunk?.choices?.[0]?.delta;
      if (!delta) continue;

      if (
        typeof delta.reasoning_content === "string" &&
        delta.reasoning_content
      ) {
        reasoning += delta.reasoning_content;
        setStatus("reasoning");
        handlers.onReasoning?.(delta.reasoning_content, reasoning);
      }

      if (typeof delta.content === "string" && delta.content) {
        content += delta.content;
        setStatus("generating");
        handlers.onContent?.(delta.content, content);
      }

      if (Array.isArray(delta.tool_calls)) {
        setStatus("generating");
        for (const raw of delta.tool_calls) {
          if (!raw || typeof raw !== "object") continue;
          const tc = raw as {
            index?: number;
            id?: string;
            function?: { name?: string; arguments?: string };
          };
          const index = typeof tc.index === "number" ? tc.index : 0;
          const acc = toolAccumulator.get(index) ?? {
            id: "",
            name: "",
            arguments: "",
          };
          const next = {
            id: tc.id || acc.id,
            name: acc.name + (tc.function?.name ?? ""),
            arguments: acc.arguments + (tc.function?.arguments ?? ""),
          };
          toolAccumulator.set(index, next);
        }
      }
    }
  }

  const toolCalls: ChatToolCall[] = [...toolAccumulator.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, call], index) => ({
      id: call.id || `call_${index}`,
      type: "function",
      function: { name: call.name, arguments: call.arguments },
    }));

  if (!content.trim() && toolCalls.length === 0) {
    throw new Error("接口未返回有效内容");
  }

  handlers.onStatus?.("parsing");
  return { content, reasoning, toolCalls };
}

/**
 * 画布 Agent：多轮调用模型，模型按需调用画布工具（创建/移动/删除/连线），
 * 执行结果回传给模型后继续，直到模型给出最终文本回复。
 * 只依赖 CanvasExecutor 端口，与具体渲染实现解耦。
 */
export async function runCanvasAgent(
  turns: { role: "user" | "assistant"; content: string }[],
  config: AIConfig,
  executor: CanvasExecutor,
  handlers: AIStreamHandlers = {},
  options: AIAgentOptions = {}
): Promise<AIAgentResult> {
  const maxSteps = Math.max(1, options.maxSteps ?? 6);

  let finalText = "";
  let reasoning = "";
  const records: AIToolCallRecord[] = [];

  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(options.canvasContext) },
    ...turns.map((turn) => ({
      role: turn.role,
      content: turn.content,
    })),
  ];

  for (let step = 0; step < maxSteps; step++) {
    const result = await streamStep(config, messages, {
      signal: handlers.signal,
      onStatus: (status) => handlers.onStatus?.(status),
      onReasoning: (delta) => {
        reasoning += delta;
        handlers.onReasoning?.(delta, reasoning);
      },
      onContent: (delta) => {
        finalText += delta;
        handlers.onContent?.(delta, finalText);
      },
    });

    if (result.toolCalls.length === 0) break;

    messages.push({
      role: "assistant",
      content: result.content || null,
      tool_calls: result.toolCalls,
    });

    handlers.onStatus?.("acting");

    for (const call of result.toolCalls) {
      let parsedArgs: unknown = call.function.arguments;
      try {
        parsedArgs = JSON.parse(call.function.arguments || "{}");
      } catch {
        // 保留原始字符串
      }

      let toolResult: CanvasToolResult;
      // 危险操作需用户确认后才执行
      if (isDangerousTool(call.function.name) && options.onConfirm) {
        const approved = await options.onConfirm({
          name: call.function.name as CanvasToolName,
          args: parsedArgs,
          summary: summarizeToolCall(call.function.name, parsedArgs),
        });
        toolResult = approved
          ? executeToolCall(call.function.name, parsedArgs, executor)
          : { ok: false, message: "用户取消了该操作，未执行，请勿重复尝试" };
      } else {
        toolResult = executeToolCall(call.function.name, parsedArgs, executor);
      }

      const record: AIToolCallRecord = {
        id: call.id,
        name: call.function.name,
        args: parsedArgs,
        result: toolResult,
      };
      records.push(record);
      handlers.onToolCall?.(record);

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(toolResult),
      });
    }
  }

  return { text: finalText.trim(), reasoning, toolCalls: records };
}

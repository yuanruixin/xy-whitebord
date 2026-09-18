// 常见 OpenAI 兼容服务商预设（Base URL + 模型列表），用户也可自行输入
export interface AIProviderPreset {
  id: string;
  label: string;
  baseURL: string;
  models: string[];
  // 强制开启思考、无法关闭的模型（UI 上禁用「深度思考」开关）
  forcedThinkingModels?: string[];
}

export const CUSTOM_PROVIDER_ID = "custom";

export const AI_PROVIDERS: AIProviderPreset[] = [
  {
    id: "openai",
    label: "OpenAI",
    baseURL: "https://api.openai.com/v1",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1", "o3-mini"],
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    baseURL: "https://api.deepseek.com",
    models: [
      "deepseek-v4-pro",
      "deepseek-v4-flash"
    ],
  },
  {
    id: "glm",
    label: "智谱 GLM",
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
    models: ["glm-5.3", "glm-5.3-flash"],
    // GLM-5.3 / GLM-5.3-FLASH 强制思考，无法关闭
    forcedThinkingModels: ["glm-5.3", "glm-5.3-flash"],
  },
  {
    id: "qwen",
    label: "通义千问",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    models: ["qwen-max", "qwen-plus", "qwen-turbo", "qwen2.5-72b-instruct"],
  },
  {
    id: "moonshot",
    label: "Moonshot",
    baseURL: "https://api.moonshot.cn/v1",
    models: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
  },
];

export function findProviderByBaseURL(baseURL: string): AIProviderPreset | undefined {
  return AI_PROVIDERS.find((provider) => provider.baseURL === baseURL);
}

export function findProviderById(id: string): AIProviderPreset | undefined {
  return AI_PROVIDERS.find((provider) => provider.id === id);
}

// 该模型是否强制思考（无法关闭）
export function isForcedThinkingModel(model: string): boolean {
  const name = model.trim().toLowerCase();
  if (!name) return false;
  return AI_PROVIDERS.some((provider) =>
    (provider.forcedThinkingModels ?? []).some(
      (item) => item.toLowerCase() === name
    )
  );
}

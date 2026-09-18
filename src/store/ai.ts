import { computed, reactive, ref, watch } from "vue";
import { decryptString, encryptString } from "@/utils/secureStorage";
import {
  AI_PROVIDERS,
  CUSTOM_PROVIDER_ID,
  findProviderByBaseURL,
  findProviderById,
} from "@/constants/aiProviders";

// AI 服务配置（兼容 OpenAI Chat Completions 接口）
export interface AIConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  provider: string;
  // 是否开启深度思考（关闭可显著加快生成）
  thinking: boolean;
}

// 落盘结构：每个服务商一个密文 token，键为归一化后的 Base URL
interface StoredAIConfig {
  baseURL?: string;
  model?: string;
  provider?: string;
  thinking?: boolean;
  tokens?: Record<string, string>;
  // 每个服务商上次使用的模型（键为归一化后的 Base URL）
  modelsByBaseURL?: Record<string, string>;
  // 兼容旧版单 token（明文 / 密文）
  apiKeyEncrypted?: string;
  apiKey?: string;
}

const STORAGE_KEY = "xy-whiteboard:ai-config";

const DEFAULT_CONFIG: AIConfig = {
  apiKey: "",
  baseURL: AI_PROVIDERS[0].baseURL,
  model: AI_PROVIDERS[0].models[0],
  provider: AI_PROVIDERS[0].id,
  thinking: false,
};

const config = reactive<AIConfig>({ ...DEFAULT_CONFIG });
const ready = ref(false);
// 输入框内是否有内容
const hasApiKey = computed(() => config.apiKey.trim().length > 0);
// 当前模型「已确认」的 token（来自确认操作或从存储读取）
const confirmedToken = ref("");
// 输入与已确认 token 一致且非空，才算配置生效
const isApiKeyConfirmed = computed(
  () =>
    config.apiKey.trim() !== "" && config.apiKey.trim() === confirmedToken.value
);
// 加载过程中不要回写，避免用默认值覆盖已存配置
let hydrating = true;

// 不同服务商（按 Base URL 归一化）各自的 token（内存中为明文，落盘时加密）
const tokens = new Map<string, string>();
// 每个服务商上次使用的模型
const modelsByBaseURL = new Map<string, string>();
// 当前 config.apiKey 对应的归属键
let currentTokenKey: string | null = null;

function normalizeBaseURL(baseURL: string) {
  return baseURL.trim().replace(/\/+$/, "").toLowerCase();
}

// 以服务商 Base URL 作为 Key，同一服务商下所有模型共用一个 Key
function buildTokenKey(baseURL: string) {
  return normalizeBaseURL(baseURL) || CUSTOM_PROVIDER_ID;
}

function readStored(): StoredAIConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAIConfig) : null;
  } catch {
    return null;
  }
}

// 载入某个模型已确认的 token
function loadToken(key: string) {
  currentTokenKey = key;
  const value = tokens.get(key) ?? "";
  confirmedToken.value = value;
  config.apiKey = value;
}

async function hydrate() {
  const stored = readStored();
  let needsMigration = false;

  if (stored) {
    if (typeof stored.baseURL === "string") config.baseURL = stored.baseURL;
    if (typeof stored.model === "string") config.model = stored.model;
    if (typeof stored.provider === "string") config.provider = stored.provider;
    if (typeof stored.thinking === "boolean") {
      config.thinking = stored.thinking;
    }

    // 恢复各服务商上次使用的模型
    if (stored.modelsByBaseURL && typeof stored.modelsByBaseURL === "object") {
      for (const [key, model] of Object.entries(stored.modelsByBaseURL)) {
        if (typeof model === "string" && model) {
          modelsByBaseURL.set(buildTokenKey(key), model);
        }
      }
    }

    // 解密每个服务商的 token（并兼容旧版按模型保存的键）
    if (stored.tokens && typeof stored.tokens === "object") {
      for (const [key, value] of Object.entries(stored.tokens)) {
        if (typeof value !== "string" || !value) continue;
        try {
          const plain = await decryptString(value);
          let targetKey = buildTokenKey(key);
          // 旧版键为 provider::model，迁移到该服务商的 Base URL
          if (key.includes("::")) {
            const providerId = key.split("::")[0];
            const preset = findProviderById(providerId);
            targetKey = buildTokenKey(preset?.baseURL ?? providerId);
            needsMigration = true;
          }
          if (!tokens.has(targetKey)) tokens.set(targetKey, plain);
        } catch (error) {
          console.warn("部分 API Key 解密失败", key, error);
        }
      }
    }

    // 兼容旧版单 token：迁移到当前服务商
    const legacy =
      stored.apiKeyEncrypted ??
      (typeof stored.apiKey === "string" ? stored.apiKey : "");
    if (legacy) {
      try {
        const plain = await decryptString(legacy);
        if (plain) tokens.set(buildTokenKey(config.baseURL), plain);
      } catch (error) {
        console.warn("API Key 解密失败，请重新配置", error);
      }
      needsMigration = true;
    }
  }

  // provider 与 baseURL 对应校正
  const matched = findProviderByBaseURL(config.baseURL);
  if (matched) config.provider = matched.id;

  loadToken(buildTokenKey(config.baseURL));

  hydrating = false;
  ready.value = true;

  if (needsMigration) void persist();
}

async function persist() {
  try {
    const encryptedTokens: Record<string, string> = {};
    for (const [key, value] of [...tokens.entries()]) {
      encryptedTokens[key] = await encryptString(value);
    }

    const payload: StoredAIConfig = {
      baseURL: config.baseURL,
      model: config.model,
      provider: config.provider,
      thinking: config.thinking,
      tokens: encryptedTokens,
      modelsByBaseURL: Object.fromEntries(modelsByBaseURL),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("保存 AI 配置失败", error);
  }
}

// 保存一次性输入：写入对应模型并落盘，之后输入框不再回显原始 token
function confirmApiKey(value: string) {
  if (!currentTokenKey) return;
  const token = value.trim();
  if (!token) return;
  tokens.set(currentTokenKey, token);
  confirmedToken.value = token;
  config.apiKey = token;
  void persist();
}

// 清除当前模型已保存的 Key
function clearApiKey() {
  if (!currentTokenKey) return;
  tokens.delete(currentTokenKey);
  confirmedToken.value = "";
  config.apiKey = "";
  void persist();
}

watch(
  config,
  () => {
    if (!hydrating) void persist();
  },
  { deep: true }
);

// 切换服务商时，读取该服务商的 token，并恢复其上次使用的模型
watch(
  () => config.baseURL,
  (baseURL) => {
    if (hydrating) return;
    const matched = findProviderByBaseURL(baseURL);
    config.provider = matched ? matched.id : CUSTOM_PROVIDER_ID;

    const key = buildTokenKey(baseURL);
    if (key !== currentTokenKey) loadToken(key);

    // 恢复该服务商上次使用的模型
    const remembered = modelsByBaseURL.get(key);
    if (remembered) {
      config.model = remembered;
    } else if (matched && !matched.models.includes(config.model)) {
      config.model = matched.models[0];
    }
  }
);

// 记录每个服务商上次使用的模型
watch(
  () => config.model,
  (model) => {
    if (hydrating) return;
    modelsByBaseURL.set(buildTokenKey(config.baseURL), model);
    void persist();
  }
);

// 选择预设服务商：切换 Base URL 与模型，token 由上面的 watch 按服务商载入
function applyProvider(id: string) {
  const preset = findProviderById(id);
  if (!preset) {
    config.provider = CUSTOM_PROVIDER_ID;
    return;
  }
  config.provider = preset.id;
  config.baseURL = preset.baseURL;
  // 优先恢复该服务商上次使用的模型，否则沿用兼容的当前模型
  const remembered = modelsByBaseURL.get(buildTokenKey(preset.baseURL));
  if (remembered) {
    config.model = remembered;
  } else if (!preset.models.includes(config.model)) {
    config.model = preset.models[0];
  }
}

void hydrate();

const showDialog = ref(false);
const showSettings = ref(false);

export function useAIStore() {
  function openDialog() {
    // 未确认 Key 时，自动展开设置区域
    showSettings.value = !isApiKeyConfirmed.value;
    showDialog.value = true;
  }

  function toggleDialog() {
    if (showDialog.value) {
      showDialog.value = false;
    } else {
      openDialog();
    }
  }

  return {
    config,
    ready,
    hasApiKey,
    isApiKeyConfirmed,
    confirmApiKey,
    clearApiKey,
    showDialog,
    showSettings,
    applyProvider,
    openDialog,
    toggleDialog,
  };
}

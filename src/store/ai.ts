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

// 落盘结构：每个模型一个密文 token，键为 `provider::model`
interface StoredAIConfig {
  baseURL?: string;
  model?: string;
  provider?: string;
  thinking?: boolean;
  tokens?: Record<string, string>;
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

// 不同服务商 / 模型各自的 token（内存中为明文，落盘时加密）
const tokens = new Map<string, string>();
// 当前 config.apiKey 对应的归属键
let currentTokenKey: string | null = null;

function buildTokenKey(provider: string, model: string) {
  return `${provider || CUSTOM_PROVIDER_ID}::${model}`;
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
    if (typeof stored.thinking === "boolean") config.thinking = stored.thinking;

    // 解密每个模型的 token
    if (stored.tokens && typeof stored.tokens === "object") {
      for (const [key, value] of Object.entries(stored.tokens)) {
        if (typeof value !== "string" || !value) continue;
        try {
          tokens.set(key, await decryptString(value));
        } catch (error) {
          console.warn("部分 API Key 解密失败", key, error);
        }
      }
    }

    // 兼容旧版单 token：迁移到当前模型的键下
    const legacy =
      stored.apiKeyEncrypted ??
      (typeof stored.apiKey === "string" ? stored.apiKey : "");
    if (legacy) {
      try {
        const plain = await decryptString(legacy);
        if (plain) tokens.set(buildTokenKey(config.provider, config.model), plain);
      } catch (error) {
        console.warn("API Key 解密失败，请重新配置", error);
      }
      needsMigration = true;
    }
  }

  // provider 与 baseURL 对应校正
  const matched = findProviderByBaseURL(config.baseURL);
  if (matched) config.provider = matched.id;

  loadToken(buildTokenKey(config.provider, config.model));

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
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("保存 AI 配置失败", error);
  }
}

// 确认当前输入：写入对应模型并落盘，之后才显示为已配置
function confirmApiKey() {
  if (!currentTokenKey) return;
  const value = config.apiKey.trim();
  if (value) tokens.set(currentTokenKey, value);
  else tokens.delete(currentTokenKey);
  confirmedToken.value = value;
  void persist();
}

watch(
  config,
  () => {
    if (!hydrating) void persist();
  },
  { deep: true }
);

// 切换模型 / 服务商时，读取该模型已确认的 token
watch(
  () => buildTokenKey(config.provider, config.model),
  (newKey) => {
    if (hydrating) return;
    if (newKey === currentTokenKey) return;
    loadToken(newKey);
  }
);

// baseURL 变化时同步 provider（无匹配则视为自定义）
watch(
  () => config.baseURL,
  (baseURL) => {
    if (hydrating) return;
    const matched = findProviderByBaseURL(baseURL);
    config.provider = matched ? matched.id : CUSTOM_PROVIDER_ID;
  }
);

// 选择预设服务商：切换 Base URL 与模型，token 由上面的 watch 按模型载入
function applyProvider(id: string) {
  const preset = findProviderById(id);
  if (!preset) {
    config.provider = CUSTOM_PROVIDER_ID;
    return;
  }
  config.provider = preset.id;
  config.baseURL = preset.baseURL;
  if (!preset.models.includes(config.model)) {
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
    showDialog,
    showSettings,
    applyProvider,
    openDialog,
    toggleDialog,
  };
}

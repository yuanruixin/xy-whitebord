import { reactive, ref, watch } from "vue";

// AI 服务配置（兼容 OpenAI Chat Completions 接口）
export interface AIConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

const STORAGE_KEY = "xy-whiteboard:ai-config";

const DEFAULT_CONFIG: AIConfig = {
  apiKey: "",
  baseURL: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
};

function loadConfig(): AIConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw) as Partial<AIConfig>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

const config = reactive<AIConfig>(loadConfig());

// 仅保存在本地浏览器，方便下次使用
watch(
  config,
  () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // 忽略存储失败（如隐私模式）
    }
  },
  { deep: true }
);

const showDialog = ref(false);
const showSettings = ref(false);

export function useAIStore() {
  function openDialog() {
    // 尚未配置 Key 时，自动展开设置区域
    showSettings.value = !config.apiKey;
    showDialog.value = true;
  }

  function toggleDialog() {
    if (showDialog.value) {
      showDialog.value = false;
    } else {
      openDialog();
    }
  }

  return { config, showDialog, showSettings, openDialog, toggleDialog };
}

import { computed, ref } from "vue";
import { useAIStore } from "@/store/ai";
import {
  AI_PROVIDERS,
  CUSTOM_PROVIDER_ID,
  isForcedThinkingModel,
} from "@/constants/aiProviders";

// 一次性输入框内容（保存后清空，不回显 token）
const apiKeyInput = ref("");
const apiKeyInputRef = ref<HTMLInputElement | null>(null);

/**
 * API Key / 服务商 / 模型等设置相关状态与操作。
 * 状态提升到模块级，保证多处调用共享同一份。
 */
export function useAIKeySettings() {
  const {
    config,
    hasApiKey,
    isApiKeyConfirmed,
    confirmApiKey,
    clearApiKey,
    showSettings,
    applyProvider,
  } = useAIStore();

  const providers = AI_PROVIDERS;
  const baseURLOptions = AI_PROVIDERS.map((provider) => provider.baseURL);

  // 当前服务商的模型列表；自定义时汇总所有预置模型
  const modelOptions = computed(() => {
    const provider = AI_PROVIDERS.find((item) => item.id === config.provider);
    if (provider) return provider.models;
    return Array.from(new Set(AI_PROVIDERS.flatMap((item) => item.models)));
  });

  // 当前模型是否强制思考（无法关闭）
  const forcedThinking = computed(() => isForcedThinkingModel(config.model));

  function onProviderChange(event: Event) {
    applyProvider((event.target as HTMLSelectElement).value);
  }

  // 一次性保存 Key：保存后立即清空输入框，不再回显
  function onConfirmApiKey() {
    const token = apiKeyInput.value.trim();
    if (!token) return;
    confirmApiKey(token);
    apiKeyInput.value = "";
  }

  function onClearApiKey() {
    clearApiKey();
    apiKeyInput.value = "";
  }

  function focusApiKeyInput() {
    apiKeyInputRef.value?.focus();
  }

  return {
    CUSTOM_PROVIDER_ID,
    config,
    hasApiKey,
    isApiKeyConfirmed,
    showSettings,
    providers,
    baseURLOptions,
    modelOptions,
    forcedThinking,
    apiKeyInput,
    apiKeyInputRef,
    onProviderChange,
    onConfirmApiKey,
    onClearApiKey,
    focusApiKeyInput,
  };
}

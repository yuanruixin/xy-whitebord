<template>
  <div
    class="flex max-h-[60%] flex-col gap-y-3 overflow-y-auto border-b border-slate-100 bg-slate-50/70 p-4"
  >
    <label class="flex flex-col gap-y-1 text-sm text-slate-700">
      <span>服务商</span>
      <select
        :value="config.provider"
        class="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-primary"
        @change="onProviderChange"
      >
        <option
          v-for="provider in providers"
          :key="provider.id"
          :value="provider.id"
        >
          {{ provider.label }}
        </option>
        <option :value="CUSTOM_PROVIDER_ID">自定义</option>
      </select>
    </label>

    <label class="flex flex-col gap-y-1 text-sm text-slate-700">
      <span class="flex items-center gap-x-1">
        API Key
        <span
          v-if="isApiKeyConfirmed"
          class="icon-[mdi--check-circle] text-green-500"
        ></span>
        <span
          v-else-if="hasApiKey"
          class="icon-[mdi--circle-medium] text-slate-400"
        ></span>
      </span>
      <div class="flex items-center gap-x-1">
        <input
          ref="apiKeyInputRef"
          v-model="apiKeyInput"
          type="password"
          autocomplete="new-password"
          :placeholder="hasApiKey ? '已保存，输入新 Key 可替换' : 'sk-...'"
          class="min-w-0 flex-1 rounded-md border px-2 py-1.5 text-sm outline-none focus:border-primary"
          :class="hasApiKey ? 'border-slate-200' : 'border-red-300 bg-red-50/40'"
          @keydown.enter.prevent="onConfirmApiKey"
        />
        <button
          type="button"
          class="shrink-0 rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!apiKeyInput.trim()"
          @click="onConfirmApiKey"
        >
          保存
        </button>
        <button
          v-if="hasApiKey"
          type="button"
          class="shrink-0 rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
          @click="onClearApiKey"
        >
          清除
        </button>
      </div>
      <span v-if="!hasApiKey" class="text-xs text-red-500">
        尚未填写 API Key，无法使用
      </span>
      <span v-else class="text-xs text-slate-400">
        已保存，不会再次显示；如需更换请输入新的 Key
      </span>
    </label>

    <label class="flex flex-col gap-y-1 text-sm text-slate-700">
      <span>Base URL</span>
      <ComboBox
        v-model="config.baseURL"
        :options="baseURLOptions"
        placeholder="https://api.openai.com/v1"
      />
    </label>

    <label class="flex flex-col gap-y-1 text-sm text-slate-700">
      <span>模型</span>
      <ComboBox
        v-model="config.model"
        :options="modelOptions"
        placeholder="gpt-4o-mini"
      />
    </label>

    <div class="flex items-center justify-between">
      <span class="flex flex-col">
        <span>深度思考</span>
        <span class="text-xs text-slate-400">
          {{ forcedThinking ? "该模型强制思考，无法关闭" : "关闭可显著加快生成" }}
        </span>
      </span>
      <Switch
        v-model="config.thinking"
        :disabled="forcedThinking"
        :class="forcedThinking || config.thinking ? 'bg-primary' : 'bg-slate-200'"
        class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span
          :class="
            forcedThinking || config.thinking
              ? 'translate-x-4'
              : 'translate-x-0.5'
          "
          class="inline-block size-4 transform rounded-full bg-white shadow transition-transform"
        />
      </Switch>
    </div>

    <p class="text-xs leading-5 text-slate-400">
      API Key 加密后仅保存在本地浏览器；每个服务商可分别保存各自的 Key，
      同一服务商下切换模型会自动复用。
    </p>
  </div>
</template>

<script setup lang="ts">
import { Switch } from "@headlessui/vue";
import { useAIKeySettings } from "./composables/useAIKeySettings";
import ComboBox from "./ComboBox.vue";

const {
  CUSTOM_PROVIDER_ID,
  config,
  hasApiKey,
  isApiKeyConfirmed,
  providers,
  baseURLOptions,
  modelOptions,
  forcedThinking,
  apiKeyInput,
  apiKeyInputRef,
  onProviderChange,
  onConfirmApiKey,
  onClearApiKey,
} = useAIKeySettings();
</script>

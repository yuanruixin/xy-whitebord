import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve("./src"),
    },
  },
  test: {
    // 纯逻辑模块优先，暂不依赖 DOM；需要时再切换 jsdom
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});

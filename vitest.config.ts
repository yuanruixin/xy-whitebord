import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve("./src"),
      // 使用 Konva 浏览器构建，配合 jsdom 运行适配层测试
      konva: resolve("./node_modules/konva/lib/index.js"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
});

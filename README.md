# XY Whiteboard

一个基于 Vue 3 + TypeScript + Konva 的图形/白板编辑器。

## 功能特性

- **绘制工具**：画笔（支持宽度、颜色、实线/虚线）、文本、图片导入
- **形状工具**：矩形、圆形、菱形、三角形、箭头、圆柱、平行四边形等 12 种内置形状
- **模板**：内置模板库，一键插入图形模板
- **选择与拖拽**：单选 / 框选 / 全选，画布拖拽平移
- **图层管理**：上移、下移、置顶、置底
- **颜色修改**：选中元素后弹出颜色选择器，快速改色
- **历史记录**：撤销 / 反撤销
- **复制粘贴**：支持复制、粘贴（含右键菜单）
- **右键菜单**：复制、删除、层级调整、粘贴
- **缩放**：滚轮缩放、工具条缩放，支持网格背景
- **导出**：导出为 PNG / JPG，支持透明、白色、网格三种背景
- **AI 生成图形**：右侧非模态对话侧边栏，配置 API Key（兼容 OpenAI 接口）后，用自然语言多轮对话；需求明确时调用画布工具直接创建图形与连线，也可读取、移动、改字/改色、删除已有图形；需求含糊会先追问澄清

## AI 生成图形

点击左侧工具栏的机器人图标，或右上角菜单的「AI 生成图形」，右侧会滑出 AI 侧边栏（不遮挡画布操作，可继续编辑）。

1. 在「API 设置」中选择服务商（OpenAI、DeepSeek、智谱 GLM、通义千问、Moonshot）或自定义：
   - `Base URL` 与 `模型` 提供预置列表，也可直接输入自定义值。
   - 「深度思考」开关：默认关闭以加快生成；DeepSeek 会发送 `thinking`、OpenAI o 系列/gpt-5 会发送 `reasoning_effort` 来控制。
   - `API Key` 为一次性输入，点击「保存」（或按回车）后输入框即清空、不再回显，从本地存储读取到的视为已保存
   - API Key 使用 AES-GCM 加密后仅保存在本地浏览器（密钥不可导出，存于 IndexedDB），不会上传到服务器。
2. 在底部输入框描述需求（`Enter` 发送，`Shift+Enter` 换行）。模型会先判断需求是否明确：
   - 明确：通过 function calling 调用画布工具完成绘制或修改（创建、连线、移动、改字/改色、删除），可读取带 id 的画布信息后精确操作已有元素；
   - 含糊：先提出 1~3 个澄清问题，回答后继续，直到明确再操作。
   - 每次生成都会带上当前画布已有元素（含 id）与可见区域信息，新图形会避开已有内容、避免重叠。
3. 生成过程为流式输出，助手消息会展示思考内容与当前阶段（连接 / 思考 / 生成 / 操作画布 / 解析）。
4. 生成完成后图形自动绘制到画布，可继续编辑、撤销；删除等危险操作会先弹出确认，由用户决定是否执行；生成中可点击停止；历史中的场景消息可「重新导入画布」。
5. 侧边栏顶部支持「新对话」与「历史对话」：对话按消息记录，可随时查看、继续或删除（本地最多保留 50 条）。

## 快捷键

| 快捷键 | 功能 |
| --- | --- |
| `Ctrl/Cmd + Z` | 撤销 |
| `Ctrl/Cmd + Y` | 反撤销 |
| `Ctrl/Cmd + C` | 复制 |
| `Ctrl/Cmd + V` | 粘贴 |
| `Ctrl/Cmd + A` | 全选 |
| `Ctrl/Cmd + R` | 刷新页面 |
| `Delete` / `Backspace` | 删除选中元素 |
| `Esc` | 取消选择 |

## 技术栈

- [Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Konva](https://konvajs.org/)（Canvas 渲染引擎）
- [Pinia](https://pinia.vuejs.org/)（状态管理）
- [Tailwind CSS](https://tailwindcss.com/)
- [Headless UI](https://headlessui.com/)（无样式组件）
- [GSAP](https://gsap.com/)（动画）

## 环境要求

- Node.js 20（见 `.nvmrc`）
- [pnpm](https://pnpm.io/)

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览构建产物
pnpm preview
```

## 常用脚本

| 脚本 | 说明 |
| --- | --- |
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 类型检查 + 构建 |
| `pnpm build:nocheck` | 跳过类型检查的构建 |
| `pnpm preview` | 预览构建产物 |
| `pnpm fix` | ESLint 修复 `src` 下代码 |
| `pnpm prepare` | 安装 Husky 钩子 |
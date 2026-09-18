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
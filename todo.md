## 1. ~~v-tooltip 全局指令~~ ✅ 已完成
    实现于 src/directives/tooltip.ts，并在 main.ts 全局注册
    已应用于 Header / ToolBar / MinorTool / ShapesTool / ZoomTool

## 2. ~~如果需要持久化，图片工具导入时，需要使用base64，而不是objectURL~~ ✅ 已完成
    src\components\ToolBar\MinorTool.vue
### （1）~~也是暂时不支持导出json和持久化的原因~~ ✅ 已完成
    已支持导出/导入 JSON，并支持 localStorage 自动保存/恢复
    因为导出若为objectURL，导入时，无法再次正常使用

## 3.选中工具的bug
当创建元素a之后，在创建元素b，将b缩小完全置于a之上。此时，点击a，a会被选中，但此时再点击b，什么都不会发生，仍然只有a被选中。
预期应该是，只有b会被选中。
猜测由于冒泡阶段触发，stage的点击事件，e.target一直是transformer而不是图形b。

## 4. 多选（Shift/Cmd + 点击）与 Cmd + 滚轮缩放 —— 暂时搁置 ⏸
    - 多选：SelectionHandlers 的 stage.mousedown / transformer.click 目前仍为 Ctrl 多选。
      待排查点：transformer 的 shouldOverdrawWholeArea 会生成 name="back" 的命中层，
      点击已选中区域时 e.target 是 back（其父才是 Transformer），需要基于
      layer.getIntersection(pointer) 取真实元素，并处理 mousedown 与 click 的重复切换。
    - 平台判断不可靠：某些环境 navigator.platform='MacIntel' 而 userAgent 是 Android，
      不能依赖 platform/UA 决定多选修饰键。
    - Cmd(⌘) + 滚轮缩放：ZoomHandlers 目前仅 ctrlKey（含触控板捏合）；metaKey 待验证。



## 1. v-tooltip 全局指令

## 2. 如果需要持久化，图片工具导入时，需要使用base64，而不是objectURL 
    src\components\ToolBar\MinorTool.vue
### （1）也是暂时不支持导出json和持久化的原因
    因为导出若为objectURL，导入时，无法再次正常使用

## 3.选中工具的bug
当创建元素a之后，在创建元素b，将b缩小完全置于a之上。此时，点击a，a会被选中，但此时再点击b，什么都不会发生，仍然只有a被选中。
预期应该是，只有b会被选中。
猜测由于冒泡阶段触发，stage的点击事件，e.target一直是transformer而不是图形b。


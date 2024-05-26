import {Render} from './index'
import type {CursorType} from './types'
// 鼠标样式类
export  class Cursor {
  render:Render
  currentType:CursorType
  constructor(render:Render) {
    this.render = render
    this.currentType = 'default'
  }

  // 设置鼠标指针样式
  set(type:CursorType = 'default') {
    console.log(type);
    
    this.currentType = type
    let style:string = type
    if (type === 'eraser') {
      style = `url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAARRJREFUOE/dlDFLxEAQhd+BVouFZ3vlQuwSyI+5a7PBRkk6k9KzTOwStJFsWv0xgaQzkNLWszim0kL2OOFc9oKRYHFTz37Lm/dmJhi5JiPzcBjAOYDz7WheADz3jalP8oIxds85P3Zd90RBqqpad133SUSXAJ5M4H3AhWVZd1EUzYQQP96VZYkkSV7btr02QY1Axtgqz/NTz/OM6qSUCMNwRURneoMJOLdt+7Gu643MfeU4zrppmgt9pibgjRBiWRRFb0R934eUcgngdrfxX4CjSwZj7C3Lsqnu8Lc05XQQBO9ENP2NKapnE5s4jme608rhNE2HxWb7qwr2A+f8SAv2BxFdDQ32rpLRVu9Pl+0wztcg6V/VPW4Vw1FsawAAAABJRU5ErkJggg==) 10 10, auto`
    }else if(type === 'brush'){
      style = `url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyOCIgaGVpZ2h0PSIyOCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIxLjUiIGQ9Ik03LjQ5NSAxMy43NTNjMy4wODgtMy41ODkgMTAuMDg0LTEwLjU5OCAxMy4wNDQtMTAuNzQ5YzEuODMtLjE3NS0xLjgxNyA2LjMyMS0xMC40NiAxMy40M20xLjM4LTYuMzlsMi4yNTcgMi4yOE0zIDIwLjg1NWMuNzEtMi41MDcuMjYyLTEuMjc1LjUwNC00LjE2MmMuMTMtLjQyOC4zODktMS43NTQgMi4wMS0yLjQxNWMxLjg0Mi0uNzUyIDMuMTkzLjM4NCAzLjU0Mi45MThjMS4wMjkgMS4xMTUgMS4xNDggMi41IDAgNC4wODJTNC41MDQgMjEuMjUzIDMgMjAuODU1IiBjb2xvcj0iIzAwMDAwMCIvPjwvc3ZnPg==) 0 24, auto`
    }
    this.render.container.style.cursor = style
  }

  // 隐藏鼠标指针
  hide() {
    this.set('none')
  }

  // 复位鼠标指针
  reset() {
    this.set()
  }

  // 设置为 ✚ 字型
  setCrosshair() {
    this.set('crosshair')
  }

  // 设置为 可移动 状态
  setMove() {
    this.set('move')
  }

  // 设置为橡皮擦样式
  setEraser() {
    this.set('eraser')
  }
  // 设置为橡皮擦样式
  setBrush() {
    this.set('brush')
  }
}

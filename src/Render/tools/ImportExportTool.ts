import Konva from 'konva'
import C2S from 'canvas2svg'
import {
  bumpVersions,
  createSceneDocument,
  parseSceneDocument,
  serializeSceneDocument,
  type BoardElement,
  type SceneDocument,
} from "@/scene"
import { elementToKonva } from "../scene/konva"
import { konvaToScene } from "../scene/fromKonva"
import { legacyKonvaToDocument } from "../scene/legacy"
import type { ICanvasContext } from "../context"
interface ImageExportOption {
  pixelRatio ?: number
  type?:'png'|'jpeg'
  bg:'white'|'grid'|'transparent'
  quality?:number
}
export class ImportExportTool {
  static readonly name = 'ImportExportTool'
  // 本地自动保存使用的 key
  static readonly storageKey = 'xy-whiteboard:scene'

  private render: ICanvasContext
  // 本地存储配额不足时禁用自动保存，避免持续报错
  private storageDisabled = false
  // 上一份元素快照，用于在内容变化时递增 version
  private lastElements: BoardElement[] = []
  constructor(render: ICanvasContext) {
    this.render = render
  }

  /**
   * 获得显示内容
   * @param silent 是否更新历史记录
   */
  async import(jsonStr:string,silent=false){
    // 仅接受版本化文档
    const sceneDocument = parseSceneDocument(jsonStr)
    if (!sceneDocument) {
      console.warn('仅支持版本化文档格式，已忽略该内容')
      return
    }
    await this.importDocument(sceneDocument, silent)
  }

  // 恢复版本化文档
  private async importDocument(sceneDocument: SceneDocument, silent = false) {
    try {
      const nodes = sceneDocument.elements.map((element) => elementToKonva(element))
      // 恢复节点图片素材
      await this.restoreImage(nodes)
      this.mountNodes(nodes, silent)
      // 合并进版本基线（同 id 保留已有版本）
      const importedIds = new Set(sceneDocument.elements.map((e) => e.id))
      this.lastElements = [
        ...sceneDocument.elements,
        ...this.lastElements.filter((e) => !importedIds.has(e.id)),
      ]
    } catch (e) {
      console.error(e)
    }
  }

  /**
   * 按元素列表增量更新画布：
   * 未变化的元素（引用相同）复用现有节点，仅重建新增 / 变更的元素，
   * 移除已删除元素，并恢复目标顺序。
   */
  applyElements(from: BoardElement[], to: BoardElement[]) {
    try {
      const layer = this.render.layer
      const fromById = new Map(from.map((element) => [element.id, element]))
      const toIds = new Set(to.map((element) => element.id))

      // 移除目标中不存在的节点
      for (const node of [...layer.getChildren()]) {
        if (this.render.ignore(node)) continue
        if (!toIds.has(node.id())) node.destroy()
      }

      const nodes: Konva.Node[] = []
      const changed: Konva.Node[] = []
      for (const element of to) {
        const existing = layer.findOne(
          (node: Konva.Node) => node.id() === element.id
        ) as Konva.Node | null
        const isChanged = fromById.get(element.id) !== element
        if (existing && !isChanged) {
          nodes.push(existing)
          continue
        }
        existing?.destroy()
        const node = elementToKonva(element)
        nodes.push(node)
        changed.push(node)
      }

      // 按目标顺序重新挂载
      layer.add(...(nodes as (Konva.Group | Konva.Shape)[]))

      // 图片素材异步恢复
      if (changed.length > 0) {
        void this.restoreImage(changed)
      }

      // 沿用导入时对已缩放节点的兼容处理
      this.render.selectionTool.select(this.render.layer.getChildren())
      this.render.selectionTool.selectingClear()
      this.render.transformer.forceUpdate()
      this.render.connectorTool.refreshAll()
      this.lastElements = to
    } catch (e) {
      console.error('增量更新失败，回退到全量恢复', e)
      void this.restore(serializeSceneDocument(createSceneDocument(to)), true)
    }
  }

  // 把节点挂载到画布：绑定 hover、插入 main layer、清空选择、按需记录历史
  private mountNodes(nodes: Konva.Node[], silent: boolean) {
    for (const node of nodes) {
      node.off('mouseenter')
      node.on('mouseenter', () => {
      })
      node.off('mouseleave')
      node.on('mouseleave', () => {

        // 隐藏 hover 框
        if (node instanceof Konva.Container) {
          node.findOne('#hoverRect')?.visible(false)
        }
      })
    }

    // 往 main layer 插入新节点
    this.render.layer.add(...(nodes as (Konva.Group | Konva.Shape)[]))
    this.render.selectionTool.select(this.render.layer.getChildren())
    // 清空选择
    this.render.selectionTool.selectingClear()

    // 上一步、下一步 无需更新 history 记录
    if(!silent){
      this.render.historyTool.updateHistory()
    }
  }
  getView() {
    // 复制画布
    const copy = this.render.stage.clone()
    // 提取 main layer 备用
    const main = copy.find('#main')[0] as Konva.Layer
    // 暂时清空所有 layer
    copy.removeChildren()

    // 提取节点
    let nodes = main.getChildren((node) => {
      return !this.render.ignore(node)
    })

    // 重新装载节点
    const layer = new Konva.Layer()
    layer.add(...nodes)
    nodes = layer.getChildren()
    
    // 计算节点占用的区域
    let minX = 0
    let maxX = copy.width() - this.render.bgSize
    let minY = 0
    let maxY = copy.height() - this.render.bgSize
    for (const node of nodes) {
      
      const x = node.x()
      const y = node.y()
      const width = node.width()
      const height = node.height()

      if (x < minX) {
        minX = x
      }
      if (x + width > maxX) {
        maxX = x + width
      }
      if (y < minY) {
        minY = y
      }
      if (y + height > maxY) {
        maxY = y + height
      }

      if (node.attrs.nodeMousedownPos) {
        // 修正正在选中的节点透明度
        node.setAttrs({
          opacity: copy.attrs.lastOpacity ?? 1
        })
      }
    }

    // 重新装载 layer
    copy.add(layer)
    // 节点占用的区域
    copy.setAttrs({
      x: -minX,
      y: -minY,
      scale: { x: 1, y: 1 },
      width: maxX - minX,
      height: maxY - minY
    })
    // 返回可视节点和 layer
    return copy
  }
  getVisibleWindowView() {
       // 复制画布
       const copy = this.render.stage.clone()
       // 提取 main layer 备用
       const main = copy.find('#main')[0] as Konva.Layer
       // 暂时清空所有 layer
       copy.removeChildren()
   
       // 提取节点
       let nodes = main.getChildren((node) => {
         return !this.render.ignore(node)
       })
   
       // 重新装载节点
       const layer = new Konva.Layer()
       layer.add(...nodes)
       nodes = layer.getChildren()
   
       // 重新装载 layer
       copy.add(layer)
       
       copy.setAttrs({
         x: this.render.stage.x(),
         y: this.render.stage.y(),
         scale: this.render.stage.scale(),
         width: this.render.stage.width(),
         height: this.render.stage.height()
       })
       
       // 返回可视节点和 layer
       return copy
  }
  // 把当前画布转换为版本化文档
  toSceneDocument(): SceneDocument {
    const copy = this.getView()
    const layer = copy.getLayers()[0]
    const raw = layer ? konvaToScene(layer.getChildren()) : []
    copy.destroy()

    // 与上一份元素比较：内容变化则递增 version，未变则复用旧版本
    const elements = bumpVersions(this.lastElements, raw)
    this.lastElements = elements
    return createSceneDocument(elements)
  }

  // 保存
  save() {
    // 输出与渲染引擎解耦的版本化文档（JSON 字符串）
    return serializeSceneDocument(this.toSceneDocument())
  }

  // 加载 image（用于导入）
  loadImage(src: string) {
    return new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image()
      img.onload = () => {
        // 返回加载完成的图片 element
        resolve(img)
      }
      img.onerror = () => {
        resolve(null)
      }
      img.src = src
    })
  }

  // 恢复图片（用于导入）
  async restoreImage(nodes: Konva.Node[] = []) {
    for (const node of nodes) {
      if (node instanceof Konva.Group) {
        // 递归
        await this.restoreImage(node.getChildren())
      } else if (node instanceof Konva.Image) {
        // 处理图片
        if (node.attrs.svgXML) {
          // svg 素材
          const blob = new Blob([node.attrs.svgXML], { type: 'image/svg+xml' })
          // dataurl
          const url = URL.createObjectURL(blob)
          // 加载为图片 element
          const image = await this.loadImage(url)
          if (image) {
            // 设置图片
            node.image(image)
          }
        } else if (node.attrs.src) {
          // 其他图片素材
          const image = await this.loadImage(node.attrs.src)
          if (image) {
            // 设置图片
            node.image(image)
          }
        }
      }
    }
  }

  // 恢复
  async restore(json: string, silent = false) {
    // 清空选择
    this.render.selectionTool.selectingClear()

    // 清空 main layer 节点
    this.render.layer.removeChildren()

    try {
      await this.import(json, silent)
    } catch (e) {
      console.error(e)
    }
  }

  // 保存到 localStorage（自动保存）
  saveToLocalStorage() {
    if (this.storageDisabled) return
    try {
      localStorage.setItem(ImportExportTool.storageKey, this.save())
    } catch (e) {
      // 图片过多时 base64 体积会超出配额，停止自动保存
      this.storageDisabled = true
      console.warn('自动保存到本地失败，可能超出存储配额', e)
    }
  }

  // 从 localStorage 读取（旧版 Konva JSON 会一次性迁移为版本化文档并回写）
  loadFromLocalStorage(): string | null {
    try {
      const raw = localStorage.getItem(ImportExportTool.storageKey)
      if (!raw) return null
      if (parseSceneDocument(raw)) return raw

      // 旧版缓存：迁移后回写，之后不再走旧格式
      const document = legacyKonvaToDocument(raw)
      if (!document) return null
      const migrated = serializeSceneDocument(document)
      localStorage.setItem(ImportExportTool.storageKey, migrated)
      return migrated
    } catch (e) {
      console.warn('读取本地缓存失败', e)
      return null
    }
  }

  // 清空本地缓存
  clearLocalStorage() {
    try {
      localStorage.removeItem(ImportExportTool.storageKey)
    } catch {
      // ignore
    }
  }

  // 导出图片base64
  getExportImageBase64(option:ImageExportOption) {
    // 获取可视节点和 layer
    const copy = this.getVisibleWindowView()
    // 背景层（默认为grid）
    const bgLayer = new Konva.Layer()
    if (option.bg!=='transparent'){  
      // 背景矩形
      const bg = new Konva.Rect({
        listening: false
      })
      bg.setAttrs({
        x: -this.render.stage.x()/this.render.stage.scaleX(),
        y: -this.render.stage.y()/this.render.stage.scaleX(),
        width: copy.width()/this.render.stage.scaleX(),
        height: copy.height()/this.render.stage.scaleY(),
        fill: '#fff'
      })
      bgLayer.add(bg)
      
    }else if(option.bg==='transparent'){
      bgLayer.removeChildren()
    }

    // 插入背景
    const children = copy.getChildren()
    copy.removeChildren()
    // 保证bg层在最底层
    copy.add(bgLayer)
    if(option.bg==='grid'){
      copy.add(this.render.layerFloor.clone())
    }
    copy.add(children[0], ...children.slice(1))

    const url = copy.toDataURL({ pixelRatio:option.pixelRatio, mimeType: `image/${option.type??'jpeg'}`, quality: 1})
    copy.destroy()

    // 通过 stage api 导出图片
    return url
  }

  // blob to base64 url
  blobToBase64(blob: Blob, type: string): Promise<string> {
    return new Promise((resolve) => {
      const file = new File([blob], 'image', { type })
      const fileReader = new FileReader()
      fileReader.readAsDataURL(file)
      fileReader.onload = function () {
        resolve((this.result as string) ?? '')
      }
    })
  }

  // 替换 svg blob: 链接
  parseSvgImage(urls: string[]): Promise<string[]> {
    return new Promise((resolve) => {
      if (urls.length > 0) {
        Promise.all(urls.map((o) => fetch(o))).then((rs: Response[]) => {
          // fetch

          // 替换为 svg 嵌套
          Promise.all(rs.map((o) => o.text())).then((xmls: string[]) => {
            // svg xml
            resolve(xmls)
          })
        })
      } else {
        resolve([])
      }
    })
  }

  // 替换其他 image 链接
  parseOtherImage(urls: string[]): Promise<string[]> {
    return new Promise((resolve) => {
      if (urls.length > 0) {
        Promise.all(urls.map((o) => fetch(o))).then((rs: Response[]) => {
          // fetch

          // 替换为 base64 url image
          Promise.all(rs.map((o) => o.blob())).then((bs: Blob[]) => {
            // blob
            Promise.all(bs.map((o) => this.blobToBase64(o, 'image/*'))).then((urls: string[]) => {
              // base64
              resolve(urls)
            })
          })
        })
      } else {
        resolve([])
      }
    })
  }

  // 替换 image 链接
  parseImage(xml: string): Promise<string> {
    return new Promise((resolve) => {
      // 找出 blob:http 图片链接（目前发现只有 svg 是）
      const svgs = xml.match(/(?<=xlink:href=")blob:https?:\/\/[^"]+(?=")/g) ?? []
      // 其他图片转为 base64
      const imgs = xml.match(/(?<=xlink:href=")(?<!blob:)[^"]+(?=")/g) ?? []

      Promise.all([this.parseSvgImage(svgs), this.parseOtherImage(imgs)]).then(
        ([svgXmls, imgUrls]) => {
          // svg xml
          svgs.forEach((svg, idx) => {
            // 替换
            xml = xml.replace(
              new RegExp(`<image[^><]* xlink:href="${svg}"[^><]*/>`),
              svgXmls[idx].match(/<svg[^><]*>.*<\/svg>/)?.[0] ?? '' // 仅保留 svg 结构
            )
          })

          // base64
          imgs.forEach((img, idx) => {
            // 替换
            xml = xml.replace(`"${img}"`, `"${imgUrls[idx]}"`)
          })

          // 替换完成
          resolve(xml)
        }
      )
    })
  }

  // 获取Svg
  async getSvg() {
    // 获取可视节点和 layer
    const copy = this.getView()
    // 获取 main layer
    const main = copy.children[0] as Konva.Layer
    // 获取 layer 的 canvas context
    const ctx = main.canvas.context._context

    if (ctx) {
      // 创建 canvas2svg
      const c2s = new C2S({ ctx, ...main.size() })
      // 替换 layer 的 canvas context
      main.canvas.context._context = c2s
      // 重绘
      main.draw()

      // 获得 svg
      const rawSvg = c2s.getSerializedSvg()
      // 替换 image 链接
      const svg = await this.parseImage(rawSvg)
      copy.destroy()

      // 输出 svg
      return svg
    }
    return Promise.resolve(
      `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="0" height="0"></svg>`
    )
  }
}

import Konva from "konva";
import { createImageElement } from "@/scene";
import type { ICanvasContext } from "../context";
interface ImageConfig {
  src: string;
}
export class Image {
  render: ICanvasContext;
  constructor(render: ICanvasContext) {
    this.render = render;
  }
  create(config: ImageConfig) {
    Konva.Image.fromURL(config.src, (imageNode) => {
      const imgWidth = imageNode.width();
      const imgHeight = imageNode.height();
      // 默认插入到当前可视区域中央
      const imgPos = this.render.stage.getAbsoluteTransform().point({
        x: (this.render.stage.width() - imgWidth) / 2,
        y: (this.render.stage.height() - imgHeight) / 2,
      });

      const element = createImageElement({
        src: config.src,
        x: imgPos.x,
        y: imgPos.y,
        width: imgWidth,
        height: imgHeight,
      });
      const group = this.render.createElement(element);

      // 把已加载的位图写入占位节点
      const image = group.findOne("Image") as Konva.Image | null;
      if (image) image.image(imageNode.image());
    });
  }
}

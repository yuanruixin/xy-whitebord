import Konva from "konva";
import { Render } from "../index";
import { nanoid } from "nanoid";
interface ImageConfig {
  src: string;
}
export class Image {
  render: Render;
  constructor(config: ImageConfig, render: Render) {
    this.render = render;
    const group = new Konva.Group();
    Konva.Image.fromURL(config.src, (image) => {
      image.setAttrs({
        id: nanoid(),
        width: image.width(),
        height: image.height(),
        name: "asset",
        x:0,
        y:0
      });

      group.add(
        new Konva.Rect({
          id: "hoverRect",
          width: image.width(),
          height: image.height(),
          fill: "rgba(0,255,0,0.3)",
          visible: false,
        })
      );

      render.layer.add(group)
      console.log(render,group);
      
    });

  }
}

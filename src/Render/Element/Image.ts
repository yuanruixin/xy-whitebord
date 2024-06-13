import Konva from "konva";
import { Render } from "../index";
import { nanoid } from "nanoid";
interface ImageConfig {
  src: string;
}
export class Image {
  render: Render;
  constructor( render: Render) {
    this.render = render;
    
  }
  create(config:ImageConfig){
    const group = new Konva.Group({
      id: nanoid(),
      name: "image",
    });
    
    Konva.Image.fromURL(config.src, (imageNode) => {
      console.log(imageNode);
      
      const imgWidth = imageNode.width()
      const imgHeight = imageNode.height()
      const imgPos = this.render.stage.getAbsoluteTransform().point({
        x:(this.render.stage.width() -imgWidth)/2 ,
        y:(this.render.stage.height()-imgHeight)/2
      })
        
      imageNode.setAttrs({
        id: nanoid(),
        width: imgWidth,
        height: imgHeight,
        name: "asset",
        src:config.src,
        x:imgPos.x,
        y:imgPos.y
      });
      group.add(imageNode)
      this.render.layer.add(group)
      
    });
  }
}
// todo

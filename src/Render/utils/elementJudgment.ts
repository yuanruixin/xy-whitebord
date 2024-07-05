import Konva from "konva";
// 所有自定义元素都是用了Konva.Group包裹
export const isTextNode = (node: Konva.Node) => {
  // 或者使用name
  return (
    node.name() === "text" ||
    (node instanceof Konva.Group && node.children[0] instanceof Konva.Text)
  );
};

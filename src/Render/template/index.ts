// 存储所有预设的模板，可以直接导入使用
import mindmap from "./data/mindmap.json";

export default [mindmap] satisfies {
  info: {
    title: string;
    description: string;
    tags: string[];
    cover: string;
  };
  data: object;
}[];
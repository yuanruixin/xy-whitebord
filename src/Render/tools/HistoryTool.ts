import { clone } from "lodash-es";
import Konva from "konva";
import { Render } from "../types";
export class HistoryTool {
  config: {
    on?: {
      historyChange?: (history: string[], historyIndex: number) => void;
      selectionChange?: (selection: Konva.Node[]) => void;
      debugChange?: (v: boolean) => void;
    };
  } = {};
  render: Render;
  history: string[] = [];
  historyIndex = -1;
  constructor(render: Render) {
    this.render = render;
  }
  prevHistory() {
    const record = this.history[this.historyIndex - 1];
    if (record) {
      this.render.importExportTool.restore(record, true);
      this.historyIndex--;
      // 历史变化事件
      this.config.on?.historyChange?.(clone(this.history), this.historyIndex)
    }
  }

  nextHistory() {
    const record = this.history[this.historyIndex + 1];
    console.log(record,this.history);
    
    if (record) {
      this.render.importExportTool.restore(record, true)
      this.historyIndex++;
      // 历史变化事件
      this.config.on?.historyChange?.(clone(this.history), this.historyIndex)
    }
  }

  updateHistory() {
    this.history.splice(this.historyIndex + 1);
    this.history.push(this.render.importExportTool.save());
    this.historyIndex = this.history.length - 1;
    // 历史变化事件
    this.config.on?.historyChange?.(
      clone(this.history),
      this.historyIndex
    );
  }
}

import Konva from "konva";
//
import * as Types from "../types";

export interface BgDrawOption {
  size: number;
  style?: "dot" | "grid";
}
export class BgDraw extends Types.BaseDraw implements Types.Draw {
  static override readonly name = "bg";
  option: BgDrawOption;

  constructor(render: Types.Render, layer: Konva.Layer, option: BgDrawOption) {
    super(render, layer);

    this.option = option;
  
    this.group.listening(false);
  }

  override draw() {
    if (this.render.config.showBg) {
      this.clear();

      // stage 状态
      const stageState = this.render.getStageState();

      // 相关参数

      // 格子大小
      const cellSize = this.option.size;

      // 行数
      const lenX = Math.ceil(
        this.render.toStageValue(stageState.width) / cellSize
      );
      // 行数
      const lenY = Math.ceil(
        this.render.toStageValue(stageState.height) / cellSize
      );

      const startX = -Math.ceil(
        this.render.toStageValue(stageState.x) / cellSize
      );
      const startY = -Math.ceil(
        this.render.toStageValue(stageState.y) / cellSize
      );

      const group = new Konva.Group();
      //  网格式背景
      const drawGrid = () => {
        // 竖线
        for (let x = startX; x < lenX + startX + 1; x++) {
          group.add(
            new Konva.Line({
              name: this.constructor.name,
              points: [
                [cellSize * x, this.render.toStageValue(-stageState.y)],
                [
                  cellSize * x,
                  this.render.toStageValue(stageState.height - stageState.y),
                ],
              ].flat(),
              stroke: "#ddd",
              strokeWidth: this.render.toStageValue(1),
              listening: false,
            })
          );
        }

        // 横线
        for (let y = startY; y < lenY + startY + 1; y++) {
          group.add(
            new Konva.Line({
              name: this.constructor.name,
              points: [
                [this.render.toStageValue(-stageState.x), cellSize * y],
                [
                  this.render.toStageValue(stageState.width - stageState.x),
                  cellSize * y,
                ],
              ].flat(),
              stroke: "#ddd",
              strokeWidth: this.render.toStageValue(1),
              listening: false,
            })
          );
        }
      };

      drawGrid();
      this.group.add(group);   
    }
  }
}

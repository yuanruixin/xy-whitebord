// 编辑修改工具条
import Konva from "konva";
import * as Types from "../types";

export interface EditBarDrawOption {
  //
}

export class ContextmenuDraw extends Types.BaseDraw implements Types.Draw {
  static override readonly name = "contextmenu";

  option: EditBarDrawOption;

  state: {
    target: Konva.Node | null; // 右键目标节点（或空白处）
    menuIsMousedown: boolean; // 菜单被鼠标按下状态
    lastPos: Konva.Vector2d | null; // 记录鼠标按下位置（用于判断按下和释放的时候是不是同一位置）
    right: boolean; // 鼠标按下的是否是右键
  };

  constructor(
    render: Types.Render,
    layer: Konva.Layer,
    option: EditBarDrawOption
  ) {
    super(render, layer);

    this.option = option;
    this.state = {
      target: null,
      menuIsMousedown: false,
      lastPos: null,
      right: false,
    };
  }

  override draw() {
    this.clear();

    if (this.state.target) {
      // 菜单数组
      const menus: Array<{
        name: string;
        action: (e: Konva.KonvaEventObject<MouseEvent>) => void;
      }> = [];

      // 点击画布画布
      if (this.state.target === this.render.stage) return
      
      // stage 状态
      const stageState = this.render.getStageState();

      // 绘制右键菜单
      const group = new Konva.Group({
        name: "contextmenu",
        width: stageState.width,
        height: stageState.height,
      });

      let top = 0;
      // 菜单每项高度
      const lineHeight = 30;
      // 上下边距
      const paddingY = 10;
      const pos = this.render.stage.getPointerPosition();
      if (pos) {
        for (let i = 0; i < menus.length; i++) {
          // 框
          const menu = menus[i];
          if (i === 0) {
            const contextmenuContainer = new Konva.Rect({
              width: this.render.toStageValue(150),
              height: lineHeight * menus.length + 2 * paddingY,
              x: this.render.toStageValue(pos.x - stageState.x),
              y: this.render.toStageValue(pos.y - stageState.y),
              cornerRadius: 5,
              listening: false,
              fill: "#fff",
              shadowColor: "black",
              shadowBlur: 20,
              shadowOpacity: 0.1,
            });
            top += paddingY;
            this.group.add(contextmenuContainer);
          }

          const rect = new Konva.Rect({
            x: this.render.toStageValue(pos.x - stageState.x),
            y: this.render.toStageValue(pos.y + top - stageState.y),
            width: this.render.toStageValue(150),
            height: this.render.toStageValue(lineHeight),
            fill: "#fff",
            name: "contextmenu",
          });
          // 标题
          const text = new Konva.Text({
            x: this.render.toStageValue(pos.x - stageState.x),
            y: this.render.toStageValue(pos.y + top - stageState.y),
            text: menu.name,
            name: "contextmenu",
            listening: false,
            fontSize: this.render.toStageValue(16),
            fill: "#333",
            width: this.render.toStageValue(150),
            height: this.render.toStageValue(lineHeight),
            align: "center",
            verticalAlign: "middle",
          });
          group.add(rect);
          group.add(text);

          // 菜单事件
          rect.on("click", (e) => {
            if (e.evt.button === Types.MouseButton.left) {
              // 触发事件
              menu.action(e);

              // 移除菜单
              this.group.removeChildren();
              this.state.target = null;
            }

            e.evt.preventDefault();
            e.evt.stopPropagation();
          });
          rect.on("mousedown", (e) => {
            if (e.evt.button === Types.MouseButton.left) {
              this.state.menuIsMousedown = true;
              // 按下效果
              rect.fill("#dfdfdf");
            }

            e.evt.preventDefault();
            e.evt.stopPropagation();
          });
          rect.on("mouseup", (e) => {
            if (e.evt.button === Types.MouseButton.left) {
              this.state.menuIsMousedown = false;
            }
          });
          rect.on("mouseenter", (e) => {
            if (this.state.menuIsMousedown) {
              rect.fill("#f2f4f7");
            } else {
              // hover in
              rect.fill("#f2f4f7");
            }

            e.evt.preventDefault();
            e.evt.stopPropagation();
          });
          rect.on("mouseout", () => {
            // hover out
            rect.fill("#fff");
          });
          rect.on("contextmenu", (e) => {
            e.evt.preventDefault();
            e.evt.stopPropagation();
          });

          top += lineHeight;
        }
      }

      this.group.add(group);
    }
  }

  handlers = {
    stage: {
      mousedown: (
        e: Konva.KonvaEventObject<GlobalEventHandlersEventMap["mousedown"]>
      ) => {
        this.state.lastPos = this.render.stage.getPointerPosition();

        if (e.evt.button === Types.MouseButton.left) {
          if (!this.state.menuIsMousedown) {
            // 没有按下菜单，清除菜单
            this.state.target = null;
            this.draw();
          }
        } else if (e.evt.button === Types.MouseButton.right) {
          // 右键按下
          this.state.right = true;
        }
      },
      mousemove: () => {
        if (this.state.target && this.state.right) {
          // 拖动画布时（右键），清除菜单
          this.state.target = null;
          this.draw();
        }
      },
      mouseup: () => {
        this.state.right = false;
      },
      contextmenu: (
        e: Konva.KonvaEventObject<GlobalEventHandlersEventMap["contextmenu"]>
      ) => {
        const pos = this.render.stage.getPointerPosition();

        if (pos && this.state.lastPos) {
          // 右键目标
          if (
            pos.x === this.state.lastPos.x ||
            pos.y === this.state.lastPos.y
          ) {
            this.state.target = e.target;
          } else {
            this.state.target = null;
          }
          this.draw();
        }
      },
      wheel: () => {
        // 画布缩放时，清除菜单
        this.state.target = null;
        this.draw();
      },
    },
  } as const;
}

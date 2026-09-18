import Konva from "konva";
import * as Types from "../types";
import type { ICanvasContext } from "../context";

export interface ContextmenuDrawOption {
  //
}

export class ContextmenuDraw extends Types.BaseDraw implements Types.Draw {
  static override readonly name = "contextmenu";

  option: ContextmenuDrawOption;

  state: {
    target: Konva.Node | null; // 右键目标节点（或空白处）
    menuIsMousedown: boolean; // 菜单被鼠标按下状态
    lastPos: Konva.Vector2d | null; // 记录鼠标按下位置（用于判断按下和释放的时候是不是同一位置）
    right: boolean; // 鼠标按下的是否是右键
  };

  constructor(
    render: ICanvasContext,
    layer: Konva.Layer,
    option: ContextmenuDrawOption
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

      // 空白画布 / 命中节点，均从动作注册表派生菜单项
      const isCanvas = this.state.target === this.render.stage;
      const target = isCanvas
        ? null
        : ((this.state.target?.parent ?? null) as Konva.Node | null);
      for (const menuAction of this.render.actions.menu(target)) {
        menus.push({
          name: menuAction.label,
          action: () => this.render.actions.run(menuAction, { target }),
        });
      }

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
      const pointerPos = this.render.stage.getPointerPosition();
      if (pointerPos) {
        const menuSizeAbsolute={
          width: 150,
          height: lineHeight * menus.length + 2 * paddingY,
        }
        const pos = this.computeSmartPosition(pointerPos, menuSizeAbsolute)
        for (let i = 0; i < menus.length; i++) {
          // 框
          const menu = menus[i];
          if (i === 0) {
            const contextmenuContainer = new Konva.Rect({
              width: this.render.toStageValue(menuSizeAbsolute.width),
              height: this.render.toStageValue(menuSizeAbsolute.height),
              x: this.render.toStageValue(pos.x- stageState.x),
              y: this.render.toStageValue(pos.y- stageState.y),
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
            y: this.render.toStageValue(pos.y+ top  - stageState.y),
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
   computeSmartPosition(
    click: { x: number; y: number },
    menuSize: {
      height: number;
      width: number;
    }
  ) {
    // 默认返回点击位置
    const result = click;
    
    const offset ={
      x: (- menuSize.width -10)*this.render.stage.scaleX(),
      y: (- menuSize.height -10)*this.render.stage.scaleX(),
    }
    const containerWidth = this.render.stage.width();
    const containertHeight = this.render.stage.height();
    if (click.x + menuSize.width > containerWidth)
      result.x = click.x + offset.x; //增加一些缓冲
    if (click.y + menuSize.height > containertHeight)
      result.y = click.y + offset.y; //增加一些缓冲
    
    return result;
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

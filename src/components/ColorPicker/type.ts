import type { FontSizePreset } from "@/constants/fontSize";

export interface Props {
  defaultColor?: string;
  colors?: string[];
  visible?: boolean;
  callback?: (color: string) => void;
  // 文本字号设置（仅选中文本时传入）
  fontSize?: number;
  fontSizes?: FontSizePreset[];
  onFontSize?: (size: number) => void;

  pos: {
    x: number;
    y: number;
  };
}
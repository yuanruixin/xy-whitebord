// 参考 Excalidraw 的字号档位
export interface FontSizePreset {
  label: string;
  value: number;
}

export const FONT_SIZE_PRESETS: FontSizePreset[] = [
  { label: "S", value: 16 },
  { label: "M", value: 20 },
  { label: "L", value: 28 },
  { label: "XL", value: 36 },
];

export const DEFAULT_FONT_SIZE = 20;

export type ToolType =
  | 'select'
  | 'hand'
  | 'rectangle'
  | 'diamond'
  | 'ellipse'
  | 'arrow'
  | 'line'
  | 'pencil'
  | 'text'
  | 'cylinder'
  | 'eraser';

export type FillStyle = 'none' | 'hachure' | 'solid' | 'cross-hatch';

export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

export type FontFamily = 'hand' | 'sans' | 'code';

export type FontSize = 'S' | 'M' | 'L' | 'XL';

export type TextAlign = 'left' | 'center' | 'right';
export type TextVerticalAlign = 'top' | 'middle' | 'bottom';

export interface Point {
  x: number;
  y: number;
}

export interface ScribbleElement {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number;
  points?: Point[];
  text?: string;
  textBox?: boolean;
  boundText?: string;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  roughness: number;
  opacity: number;
  fontFamily: FontFamily;
  fontSize: FontSize;
  textAlign: TextAlign;
  textVerticalAlign?: TextVerticalAlign;
  seed: number;
  isDeleted?: boolean;
  startBinding?: string;
  endBinding?: string;
}

export interface Viewport {
  panX: number;
  panY: number;
  zoom: number;
}

export interface AppState {
  activeTool: ToolType;
  selectedElementIds: string[];
  strokeColor: string;
  backgroundColor: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  roughness: number;
  opacity: number;
  fontFamily: FontFamily;
  fontSize: FontSize;
  textAlign: TextAlign;
  textVerticalAlign?: TextVerticalAlign;
  isLocked: boolean;
  gridSize: number | null;
}

export type ResizeHandle =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w'
  | 'rotation'
  | 'inside';

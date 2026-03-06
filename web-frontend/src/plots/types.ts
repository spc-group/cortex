import type { NdArray } from "ndarray";

export interface LineData {
  x?: NdArray;
  y?: NdArray;
  name?: string;
  color?: string;
}

export interface ROI {
  name: string;
  isActive: boolean;
  x0: number;
  x1: number | null;
  y0: number;
  y1: number | null;
}

export interface ROIUpdate {
  name?: string;
  isActive?: boolean;
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
}

export interface LineData {
  x: number[] | null;
  y: (number | null)[] | null;
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

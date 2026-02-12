import type { Spec } from "../tiled/types";

export interface Column {
  label: string;
  name: string;
  field: string;
  query: null | {
    key:
      | "start.uid"
      | "start.plan_name"
      | "start.scan_name"
      | "start.sample_name"
      | "stop.exit_status"
      | "start.time"
      | "start.proposal_id"
      | "start.esaf_id"
      | "structure_family";
    type: "eq" | "contains" | "comparison";
    operator?: "lt" | "gt" | "le" | "ge";
    case_sensitive?: boolean;
    options?: string[];
  };
}

export interface TableColumn extends Column {
  // Added by useState hooks
  filter: string;
  setFilter: (state: string) => void;
  debouncedFilter: string;
}

export interface RunMetadata {
  start: {
    esaf_id?: string;
    proposal_id?: string;
    sample_name?: string;
    scan_name?: string;
    plan_name?: string;
    time: number;
    uid: string;
    hints?: { dimensions: [string[], string][] };
  };
  stop?: {
    exit_status: string;
  };
}

export interface Run {
  uid: string;
  path: string;
  structure_family: string;
  specs: Spec[];
  metadata: RunMetadata;
  structure: object;
}

export interface DataKey {
  // Description of a column/signal in a run.
  dtype: string;
  shape: number[];
  units?: string;
  limits?: {
    control: {
      low: number;
      high: number;
    };
    display: {
      low: number;
      high: number;
    };
  };
  source: string;
  precision?: number;
  dtype_numpy?: string;
  object_name?: string;
}

export interface StreamMetadata {
  data_keys: { [key: string]: DataKey };
  uid: string;
  time: number;
  hints: { [key: string]: { fields: string[] } };
  configuration: { [key: string]: { data?: { [key: string]: object } } };
}

export interface Stream {
  ancestors: string[];
  structure_family: string;
  specs: Spec[];
  data_keys: { [key: string]: DataKey };
  configuration: { [key: string]: { data?: { [key: string]: object } } };
  hints: { [key: string]: { fields: string[] } };
  time: number;
  uid: string;
  key: string;
}

export interface ROI {
  name: string;
  isActive: boolean;
  x0: number | null;
  x1: number | null;
  y0: number | null;
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

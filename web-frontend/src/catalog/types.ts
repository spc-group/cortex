import type { Spec } from "../tiled/types";
import type { ROI } from "../plots";

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
  source: string; // E.g. "ca://25iddVME:3820:scaler1_netA.D"
  external?: string;
  precision?: number; // E.g. 3
  dtype_numpy?: string; // E.g. "<f8"
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

export interface DataSource {
  // Describes a way to retrieve data from the API and produce a 1D array
  path: string; // E.g. "<uid>/primary/internal/I0-count_rate"
  dataKey: DataKey;
  roi?: ROI; // Will be applied to the dataset after its retrieved
}

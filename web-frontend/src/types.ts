import { ReadyState } from "react-use-websocket";

export interface Column {
  label: string;
  name: string;
  field:
    | "start.uid"
    | "start.plan_name"
    | "start.scan_name"
    | "start.sample_name"
    | "stop.exit_status"
    | "start.time"
    | "start.proposal"
    | "start.esaf"
    | "structure_family";
}

export interface TableColumn extends Column {
  // Added by useState hooks
  filter: string;
  setFilter: (state: string) => void;
  debouncedFilter: string;
}

export interface SearchParams {
  pageOffset?: number;
  pageLimit?: number;
  filters?: { [key: string]: string };
  sortField?: string;
  searchText?: string;
  standardsOnly?: boolean;
}

export interface Run {
  key: string;
  ancestor: string[];
  structure_family: string;
  specs: BlueskySpec[];
  metadata: {
    start: {
      esaf_id: string;
      proposal_id: string;
      sample_name: string;
      scan_name: string;
      plan_name: string;
      time: number;
      uid: string;
    };
    stop: {
      exit_status: string;
    };
  };
  structure: {
    data_type: {
      endianess: string;
      kind: string;
      itemsize: number;
      dt_units: string;
    };
    chunks: [[number]];
    shape: [number];
    dims: [string];
    resizable: boolean;
  };
}

export interface Stream {
  ancestors: string[];
  structure_family: string;
  specs: BlueskySpec[];
  data_keys: { [key: string]: DataKey };
  configuration: { [key: string]: object };
  hints: { [key: string]: { fields: string[] } };
  time: number;
  uid: string;
  key: string;
}

export interface WebSocketNode {
  key: string;
  type: string;
  sequence: number;
  structure_family: string;
  specs: BlueskySpec[];
  metadata: { [key: string]: object | number | string };
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

export interface BlueskySpec {
  name: string;
  version: string;
}

export interface webSocketMessage {
  lastMessage: { data: Blob };
  readyState: ReadyState;
}

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
  pageOffset: number;
  pageLimit: number;
  filters?: Map<string, string>;
  sortField?: string;
  searchText?: string;
  standardsOnly?: boolean;
}

export interface Run {
  "start.uid": string;
  "start.plan_name": string;
  "start.scan_name": string;
  "start.sample_name": string;
  "stop.exit_status": string;
  "start.time": Date;
  "start.proposal": string;
  "start.esaf": string;
  specs: BlueskySpec[];
  structure_family: string;
}

export interface DataKey {
  // Description of a column/signal in a run.
  dtype: string;
  shape: number[];
  units: string;
  limits: {
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
  precision: number;
  dtype_numpy: string;
  object_name: string;
}

export interface BlueskySpec {
  name: string;
  version: string;
}

export interface APIRun {
  id: string;
  attributes: {
    ancestor: string[];
    structure_family: string;
    specs: BlueskySpec[];
    metadata: {
      start: {
        esaf: string;
        proposal: string;
        sample_name: string;
        scan_name: string;
        plan_name: string;
        time: number;
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
  };
}

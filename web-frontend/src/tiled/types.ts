// Type and interface declarations for the Tiled API client

export interface Spec {
  name: string;
  version: string;
}

// The type of data return from /api/v1/metadata and /api/v1/search
export interface NodeMetadata<M = object, S = object> {
  id: string;
  attributes: {
    ancestors: string[];
    structure_family: string;
    specs: Spec[];
    metadata: M;
    structure: S;
  };
  links: {
    self: string;
    search: string;
    full: string;
  };
  meta: { [key: string]: unknown };
}

export interface WebSocketMessage {
  sequence: number;
  timestamp: string;
  type: string;
}

// A Message sent with details of a new or updated Container
// Remove the default generic type after refactoring all the client code
export interface WebSocketContainer<M = object> extends WebSocketMessage {
  key: string;
  metadata: M;
  specs: Spec[];
  structure_family?: string;
}

export interface WebSocketArray extends WebSocketMessage {
  data_source: {
    id: number;
    structure_family: string;
    structure: ArrayStructure;
  };
  mimetype: string;
  management: string;
}

export interface ArrayStructure {
  data_type: {
    endianness: string;
    kind: string;
    itemsize: number;
    dt_units: string | null;
  };
  chunks: number[][];
  shape: number[];
  dims: null;
  resizable: boolean;
}

export interface Query {
  type: string;
  value: string | number | boolean | string[];
  key?: string;
  operator?: string;
  case_sensitive?: boolean;
}

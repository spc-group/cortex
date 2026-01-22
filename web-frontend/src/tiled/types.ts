// Type and interface declarations for the Tiled API client

export interface Spec {
  name: string;
  version: string;
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

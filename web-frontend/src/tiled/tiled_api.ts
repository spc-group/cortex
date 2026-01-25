import { tableFromIPC } from "apache-arrow";
import axios from "axios";
import type { AxiosInstance } from "axios";
import type { DataKey, Stream } from "../catalog/types";
import type { Spec as BlueskySpec } from "./types";
import qs from "qs";

const envHost = import.meta.env.VITE_TILED_URI;
export const tiledHost = envHost ?? "http://127.0.0.1:0";
export const tiledUri = tiledHost + "/api/v1/";

export const v1Client = axios.create({
  baseURL: tiledUri,
});

// Retrieve the info about API accepted formats, etc.
export const getApiInfo = async ({
  client,
}: { client?: AxiosInstance } = {}) => {
  const client_ = client ?? v1Client;
  const response = await client_.get("");
  return response.data;
};

// Retrieve the data key descriptions for a given run + stream.
export const getDataKeys = async (
  uid: string,
  stream: string,
  { client }: { client?: AxiosInstance } = {},
): Promise<{ [key: string]: DataKey }> => {
  const path = `${uid}/${stream}`;
  const client_ = client ?? v1Client;
  const response = await client_.get(`metadata/${path}`);
  return response.data.data.attributes.metadata.data_keys;
};

export const getTableData = async (
  path: string,
  columns?: string[],
  partition?: number,
  { client }: { client?: AxiosInstance } = {},
) => {
  const client_ = client ?? v1Client;
  const endpoint = partition == null ? "/table/full" : "/table/partition";

  const queryParams: { column?: string[]; partition?: number; format: string } =
    {
      format: "application/vnd.apache.arrow.file",
      // format: "application/json",
    };
  if (columns != null) {
    queryParams.column = columns.filter((col) => col !== "---");
  }
  if (partition != null) {
    queryParams.partition = partition;
  }
  const uri = `${endpoint}/${path}/internal`;
  const response = await client_.get(uri, {
    params: queryParams,
    paramsSerializer: (params) => {
      return qs.stringify(params, { indices: false });
    },
    responseType: "arraybuffer",
  });
  // Convert the raw data from a byte stream to a apache arrow table
  const table = tableFromIPC(new Uint8Array(response.data));
  return table;
};

type APIStream = {
  data: {
    id: string;
    attributes: {
      metadata: { [key: string]: object | string | number };
      ancestors: string[];
      structure_family: string;
      specs: BlueskySpec[];
    };
  }[];
};

export const getStreams = async (
  uid: string,
  { client }: { client?: AxiosInstance } = {},
): Promise<{ [key: string]: Stream }> => {
  const client_ = client ?? v1Client;
  const { data } = await client_.get<APIStream>(`search/${uid}`);
  // Check if we are reading a legacy run with the old "streams" namespace
  let streamData = data.data;
  const streamNames = streamData.map((child) => child.id);
  const hasStreamsNamespace = JSON.stringify(streamNames) === '["streams"]';
  if (hasStreamsNamespace) {
    const { data } = await client_.get(`search/${uid}/streams`);
    streamData = data.data;
  }
  // Convert to the internal Stream interface
  const streamEntries = streamData.map((datum) => {
    const attrs = datum.attributes;

    const key = datum.id;
    return [
      key,
      {
        key: key,
        ancestors: attrs.ancestors,
        structure_family: attrs.structure_family,
        specs: attrs.specs,
        data_keys: attrs.metadata.data_keys,
        configuration: attrs.metadata.configuration,
        hints: attrs.metadata.hints,
        time: attrs.metadata.time,
        uid: attrs.metadata.uid,
      },
    ];
  });
  const streams = Object.fromEntries(streamEntries);
  return streams;
};

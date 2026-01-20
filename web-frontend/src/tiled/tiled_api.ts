import { tableFromIPC } from "apache-arrow";
import axios from "axios";
import type { AxiosInstance } from "axios";
import type { SearchParams, Run, DataKey, Stream, BlueskySpec } from "../types";
import qs from "qs";

const envHost = import.meta.env.VITE_TILED_URI;
export const tiledHost = envHost ?? "http://127.0.0.1:0";
export const tiledUri = tiledHost + "/api/v1/";

interface APIRun {
  id: string;
  attributes: Run;
}

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

export const getMetadata = async (
  path: string,
  { client }: { client?: AxiosInstance } = {},
) => {
  const client_ = client ?? v1Client;
  if (path === null) {
    return {};
  }
  const response = await client_.get(`metadata/${encodeURIComponent(path)}`, {
    params: {},
  });
  return response.data.data.attributes.metadata;
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

// Parse the query parameters needed for a search
// @params filters: An object of the form {"start.beamline_id": "25-ID-C"}
export const prepareQueryParams = ({
  pageOffset,
  pageLimit,
  filters,
  sortField = "",
  searchText = "",
  standardsOnly = false,
}: SearchParams) => {
  // Set up query parameters
  const params = new URLSearchParams();
  if (sortField !== "") {
    params.append("sort", sortField);
  }
  params.append("fields", "metadata");
  params.append("fields", "specs");
  params.append("fields", "count");
  params.append("page[offset]", String(pageOffset ?? 0));
  params.append("page[limit]", String(pageLimit ?? 100));
  for (const [field, value] of Object.entries(filters ?? {})) {
    params.append("filter[contains][condition][key]", field);
    params.append("filter[contains][condition][value]", `"${value}"`);
  }
  if (standardsOnly) {
    params.append("filter[eq][condition][key]", "start.is_standard");
    params.append("filter[eq][condition][value]", "true");
  }
  if (searchText !== "") {
    params.append("filter[fulltext][condition][text]", searchText);
  }
  return params;
};

// Retrieve set of runs metadata from the API
export const getRuns = async (
  searchParams: SearchParams,
  { client }: { client?: AxiosInstance } = {},
) => {
  const client_ = client ?? v1Client;
  const params = prepareQueryParams(searchParams);
  // retrieve list of runs from the API
  const response = await client_.get(`search/`, {
    params: params,
  });
  // Parse into a sensible list defintion
  const runs = response.data.data.map((run: APIRun) => {
    const specs = run.attributes.specs;
    return {
      metadata: run.attributes.metadata,
      key: run.id,
      specs: specs === null ? [] : specs,
      structure_family: run.attributes.structure_family,
    };
  });
  return await {
    runs: runs,
    count: response.data.meta.count,
  };
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

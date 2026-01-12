import axios from "axios";
import type { AxiosInstance } from "axios";
import type { SearchParams, APIRun, DataKey } from "./types";
import qs from "qs";

const envHost = import.meta.env.VITE_TILED_URI;
export const tiledHost = envHost ?? "http://127.0.0.1:0";
export const tiledUri = tiledHost + "/api/v1/";

export const v1Client = axios.create({
  baseURL: tiledUri,
});

// Retrieve the info about API accepted formats, etc.
export const getApiInfo = async ({client}: {client: AxiosInstance} = {}) => {
  const client_ = client ?? v1Client;
  const response = await client_.get("");
  return response.data;
};

export const getMetadata = async (
  path: string,
  client: AxiosInstance = v1Client,
) => {
  if (path === null) {
    return {};
  }
  const response = await client.get(`metadata/${encodeURIComponent(path)}`, {
    params: {},
  });
  return response.data.data.attributes.metadata;
};

// Retrieve the data key descriptions for a given run + stream.
export const getDataKeys = async (
  uid: string,
  stream: string,
  {client}: {client?: AxiosInstance} = {},
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
  {client}: {client: AxiosInstance} = {},
) => {
  const client_ = client ?? v1Client;
  const params = prepareQueryParams(searchParams);
  // retrieve list of runs from the API
  const response = await client_.get(`search/`, {
    params: params,
  });
  // Parse into a sensible list defintion
  const runs = response.data.data.map((run: APIRun) => {
    const start_doc = run.attributes.metadata.start;
    const stop_doc = run.attributes.metadata.stop ?? {};
    const date = new Date(start_doc.time * 1000);
    const specs = run.attributes.specs;
    return {
      "start.uid": run.id,
      "start.plan_name": start_doc.plan_name,
      "start.scan_name": start_doc.scan_name ?? null,
      "start.sample_name": start_doc.sample_name ?? null,
      "stop.exit_status": stop_doc.exit_status ?? null,
      "start.time": date.toLocaleString(),
      "start.proposal": start_doc.proposal ?? null,
      "start.esaf": start_doc.esaf ?? null,
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
  stream?: string,
  uid?: string,
  columns?: string[],
  partition?: number,
  {client} = {},
) => {
  if (uid == null || stream == null) {
    return {};
  }
  const client_ = client ?? v1Client;
  const endpoint = (partition == null) ? "/table/full" : "/table/partition";
  const queryParams: { column?: string[]; partition?: number } = {};
  if (columns != null) {
    queryParams.column = columns;
  }
  if (partition != null) {
    queryParams.partition = partition;
  }
  const uri = `${endpoint}/${uid}/${stream}/internal`;
  const response = await client_.get(uri, {
    params: queryParams,
    paramsSerializer: (params) => {
      return qs.stringify(params, { indices: false });
    },
  });
  return response.data;
};


export const getStreams = async (uid: string, {client}={}): string[] => {
  const client_ = client ?? v1Client;
  const searchParams = {};
  const {data, status} = await client_.get(`search/${uid}`, {
    params: searchParams,
  });
  // Check if we are reading a legacy run with the old "streams" namespace
  let streamNames = data.data.map((child) => child.id);
  const hasStreamsNamespace = (JSON.stringify(streamNames) === '["streams"]');
  if (hasStreamsNamespace) {
    const {data, status} = await client_.get(`search/${uid}/streams`, {
      params: searchParams,
    });
    streamNames = data.data.map((child) => `streams/${child.id}`);
  }
  return streamNames;
}

import axios from "axios";
import type { AxiosInstance } from "axios";
import type { SearchParams, APIRun } from "./types";

const envHost = import.meta.env.VITE_TILED_URI;
export const tiledHost = envHost === undefined ? "" : envHost;
export const tiledUri = tiledHost + "/api/v1/";

export const v1Client = axios.create({
  baseURL: tiledUri,
});

// Retrieve the info about API accepted formats, etc.
export const getApiInfo = async (client: AxiosInstance = v1Client) => {
  const response = await client.get("");
  return response.data;
};

export const getMetadata = async (
  path: string,
  client: AxiosInstance = v1Client,
) => {
  const response = await client.get(`metadata/${encodeURIComponent(path)}`, {
    params: {},
  });
  console.log(response);
  return response.data;
};


// Parse the query parameters needed for a search
export const prepareQueryParams = ({
  pageOffset,
  pageLimit,
  filters = new Map(),
  sortField = null,
  searchText = "",
  standardsOnly = false,
}: SearchParams) => {
  // Set up query parameters
  const params = new URLSearchParams();
  if (sortField !== null) {
    params.append("sort", sortField);
  }
  params.append("fields", "metadata");
  params.append("fields", "specs");
  params.append("fields", "count");
  params.append("page[offset]", String(pageOffset));
  params.append("page[limit]", String(pageLimit));
  for (const [field, value] of filters) {
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
export const getRuns = async (searchParams: SearchParams, client: AxiosInstance = v1Client) => {
  const params = prepareQueryParams(searchParams);
  // retrieve list of runs from the API
  const response = await client.get(`search/`, {
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

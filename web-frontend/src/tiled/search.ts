import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ReadyState } from "react-use-websocket";
import type { AxiosInstance } from "axios";

import type { Query, WebSocketContainer, NodeMetadata } from "./types";
import { useTiledWebSocket } from "./streaming";
import { v1Client } from "./tiled_api";

const validQueryTypes = [
  "eq",
  "fulltext",
  "regex",
  "noteq",
  "comparison",
  "contains",
  "in",
  "notin",
  "like",
];

// Retrieve set of search results from the API
// @param searchParams - query parameters to execute in the search
// @returns data - An array of run metadata for the results
// @returns count - Total number of entries matching the search query
export const getSearch = async (
  searchParams: {
    pageOffset: number;
    pageLimit: number;
    sortField: string | null;
    filters: Query[];
  },
  { client }: { client?: AxiosInstance } = {},
) => {
  const client_ = client ?? v1Client;
  const params = prepareQueryParams(searchParams);
  // retrieve list of runs from the API
  const response = await client_.get(`search/`, {
    params: params,
  });
  return {
    data: response.data.data,
    count: response.data.meta.count,
  };
};

// Parse the query parameters needed for a search
// @params filters: An object of the form {"start.beamline_id": "25-ID-C"}
export const prepareQueryParams = ({
  pageOffset,
  pageLimit,
  filters,
  sortField,
}: {
  pageOffset: number;
  pageLimit: number;
  filters: Query[];
  sortField: string | null;
}) => {
  // Set up query parameters
  const params = new URLSearchParams();
  if (sortField != null) {
    params.append("sort", sortField);
  }
  params.append("fields", "metadata");
  params.append("fields", "specs");
  params.append("fields", "count");
  params.append("page[offset]", String(pageOffset ?? 0));
  params.append("page[limit]", String(pageLimit ?? 100));
  // Add query params for all the filters
  for (const query of filters ?? []) {
    switch (query.type) {
      case "fulltext":
        params.append(
          "filter[fulltext][condition][text]",
          JSON.stringify(query.value),
        );
        break;
      case "regex":
        params.append("filter[regex][condition][key]", query.key ?? "");
        params.append(
          "filter[regex][condition][pattern]",
          JSON.stringify(query.value),
        );
        params.append(
          "filter[regex][condition][case_sensitive]",
          JSON.stringify(Boolean(query.case_sensitive ?? true)),
        );
        break;
      case "eq":
      case "noteq":
      case "contains":
      case "in":
      case "notin":
        // Simple key-value queries
        params.append(`filter[${query.type}][condition][key]`, query.key ?? "");
        params.append(
          `filter[${query.type}][condition][value]`,
          JSON.stringify(query.value),
        );
        break;
      case "like":
        // Simple key-value queries
        params.append(`filter[${query.type}][condition][key]`, query.key ?? "");
        params.append(
          `filter[${query.type}][condition][pattern]`,
          JSON.stringify(query.value),
        );
        break;
      case "comparison":
        params.append("filter[comparison][condition][key]", query.key ?? "");
        params.append(
          "filter[comparison][condition][value]",
          JSON.stringify(query.value ?? ""),
        );
        params.append(
          "filter[comparison][condition][operator]",
          query.operator ?? "",
        );
        break;
      default:
        throw new Error(
          `Can not filter type "${query.type}". Must be one of [${validQueryTypes}].`,
        );
    }
  }
  return params;
};

// A react hook that provides the latest search results for a given
// query.  This hook listens for updates via web-sockets, but unlike
// other hooks, it only uses the websocket connection as a
// notification of an update. It performs a full HTTP search GET
// request whenever an update is indicated.
export const useSearch = <M>(
  path: string,
  {
    sortField,
    pageLimit,
    pageOffset,
    filters,
  }: {
    sortField: string | null;
    pageLimit: number;
    pageOffset: number;
    filters: Query[];
  },
): {
  // Return type
  data: NodeMetadata<M>[] | null;
  isLoading: boolean;
  error: unknown;
  count: number;
  readyState: ReadyState;
} => {
  // References to return past results during re-loading
  const countRef = useRef(0);
  const nodesRef = useRef(null);
  // Subscribe to websocket to know if we should refresh the query
  const { payload, readyState } =
    useTiledWebSocket<WebSocketContainer<M>>(path);
  const webSocketSequence = payload?.sequence;
  // Get full search results over HTTP
  const filterEntries = Object.entries(filters ?? []);
  const filterKeys = filterEntries.length > 0 ? filterEntries.flat() : [];
  const { isLoading, error, data } = useQuery({
    queryFn: async () => {
      // await (new Promise(resolve => setTimeout(resolve, 2000)));
      return await getSearch({
        filters,
        pageLimit,
        pageOffset,
        sortField,
      });
    },
    queryKey: [
      "all-runs",
      webSocketSequence,
      sortField,
      pageLimit,
      pageOffset,
      ...filterKeys,
    ],
  });
  // Update references for next re-load
  if (!isLoading && data != null) {
    const { data: nodes, count } = data;
    nodesRef.current = nodes;
    countRef.current = count;
  }
  return {
    data: nodesRef.current,
    isLoading,
    error,
    count: countRef.current,
    readyState,
  };
};

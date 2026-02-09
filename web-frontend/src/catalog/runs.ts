import type { ReadyState } from "react-use-websocket";

import { useSearch } from "../tiled";
import type { Run, RunMetadata } from "./types";
import type { Query } from "../tiled/types";

// Hook to retrieve runs from Tiled. Performs a search and converts
// the results to Run types.
export const useRuns = ({
  sortField,
  pageLimit,
  pageOffset,
  filters,
}: {
  sortField: string | null;
  pageLimit: number;
  pageOffset: number;
  filters: Query[];
}): {
  // Return type
  runs: Run[];
  isLoading: boolean;
  error: unknown;
  count: number;
  readyState: ReadyState;
  timestamp: number;
} => {
  const path = "";
  const { data, ...rest } = useSearch<RunMetadata>(path, {
    pageOffset: pageOffset,
    pageLimit: pageLimit,
    sortField: sortField,
    filters: filters,
  });
  // Convert to internal Run structure
  const runs =
    data?.map((node): Run => {
      return {
        metadata: node.attributes.metadata,
        uid: node.attributes.metadata.start.uid,
        path: node.attributes.ancestors.join("/"),
        structure_family: node.attributes.structure_family,
        specs: node.attributes.specs,
        structure: node.attributes.structure,
      };
    }) ?? [];
  return {
    runs: runs,
    ...rest,
  };
};

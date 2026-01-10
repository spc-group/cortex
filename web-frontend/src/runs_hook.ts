import { useQuery } from "@tanstack/react-query";
import { getRuns } from "./tiled_api";

// A hook to load the list of runs from the Tiled server Parameters
// describe various parameters that are passed to the Tiled search endpoint.
export const useRuns = (
  {
    sortField,
    pageLimit,
    pageOffset,
    searchText,
    standardsOnly,
    filters,
  }: {
    sortField?: string;
    pageLimit?: number;
    pageOffset?: number;
    searchText?: string;
    standardsOnly?: boolean;
    filters?: { [key: string]: string };
  } = {
    filters: {},
  },
) => {
  const loadRuns = async () => {
    const theRuns = await getRuns({
      filters,
      pageLimit,
      pageOffset,
      sortField,
      searchText: searchText,
      standardsOnly,
    });
    return theRuns;
  };

  // Query for retrieving data for the list of runs
  const filterEntries = Object.entries(filters ?? []);
  const filterKeys = filterEntries.length > 0 ? filterEntries.flat() : [];
  const { isLoading, error, data } = useQuery({
    queryKey: [
      "all-runs",
      sortField,
      pageLimit,
      pageOffset,
      searchText,
      standardsOnly,
      ...filterKeys,
    ],
    queryFn: loadRuns,
  });
  let allRuns, runCount;
  if (isLoading || error) {
    allRuns = [];
    runCount = 0;
  } else {
    allRuns = data?.runs ?? [];
    runCount = data?.count ?? 0;
  }
  return {
    runs: allRuns,
    isLoading: isLoading,
    error: error,
    runCount: runCount,
  };
};

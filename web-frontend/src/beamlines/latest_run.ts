import { useRuns } from "../catalog";

// Shortcut hook to get the most recent run from a catalog
export const useLatestRun = (beamlineId?: string) => {
  const filters =
    beamlineId == null
      ? []
      : [
          {
            type: "eq",
            key: "start.beamline_id",
            value: beamlineId,
          },
        ];
  const { runs, isLoading, readyState, count } = useRuns({
    sortField: "-start.time",
    filters: filters,
    pageLimit: 1,
    pageOffset: 0,
  });

  let run;
  if (isLoading || count === 0) {
    run = null;
  } else {
    run = runs[0];
  }
  // Return the results, preferring websocket results over fetch
  return {
    run: run,
    readyState: readyState,
    isLoading: isLoading,
  };
};

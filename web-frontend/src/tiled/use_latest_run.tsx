import { useTiledWebSocket } from "./streaming";
import { useRuns } from "./use_runs";
import type { WebSocketNode } from "../types";

export const useLatestRun = ({
  beamlineId,
}: {
  beamlineId?: string;
} = {}) => {
  const url = "stream/single/?envelope_format=msgpack";
  const { payload, readyState } = useTiledWebSocket<WebSocketNode>(url);
  // Get the latest run through a regular query as a fallback
  const filters: { "start.beamline_id"?: string } = {};
  if (beamlineId != null) {
    filters["start.beamline_id"] = beamlineId;
  }
  const {
    runs,
    runCount,
    isLoading: isLoadingRuns,
  } = useRuns({
    sortField: "-start.time",
    filters: filters,
    pageLimit: 1,
    pageOffset: 0,
  });
  let run;
  if (payload?.type === "container-child-created") {
    run = payload;
  } else if (isLoadingRuns || runCount === 0) {
    run = null;
  } else {
    run = runs[0];
  }
  // Return the results, preferring websocket results over fetch
  return {
    run: run,
    readyState: readyState,
    sequence: payload?.sequence,
  };
};

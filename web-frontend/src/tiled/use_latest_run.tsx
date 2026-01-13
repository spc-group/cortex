import { useTiledWebSocket } from "./streaming";
import { useRuns } from "./use_runs";


export const useLatestRun = ({
  beamlineId,
}: {
  beamlineId: string;
} = {}) => {
  const url = "stream/single/?envelope_format=msgpack";
  const {payload, readyState} = useTiledWebSocket(url);
  // Get the latest run through a regular query as a fallback
  const {
    runs,
    runCount,
    isLoading: isLoadingRuns,
  } = useRuns({
    sortField: "-start.time",
    filters: {
      "start.beamline_id": beamlineId,
    },
    pageLimit: 1,
    pageOffset: 0,
  });
  let run;
  if (payload?.type === "container-child-created") {
    run = payload;
  }  else if (isLoadingRuns || runCount === 0) {
    run = null;
  } else {
    run = runs[0]
  }
  // Return the results, preferring websocket results over fetch
  return {
    run: run,
    readyState: readyState,
    sequence: payload?.sequence,
  };
};


// Example websocket message for new run being created
// {
//     "type": "container-child-created",
//     "sequence": 3475,
//     "timestamp": "2026-01-12T21:46:07.751846",
//     "key": "6b757d2f-c0d0-4d9d-a0a3-4f1bcbe94c2e",
//     "structure_family": "container",
//     "specs": [
//         {
//             "name": "BlueskyRun",
//             "version": "3.0"
//         }
//     ],
//     "metadata": {
//         "start": {
//             "uid": "6b757d2f-c0d0-4d9d-a0a3-4f1bcbe94c2e",
//             "time": 1768275967.7297194,
//             "versions": {
//                 "ophyd": "1.11.0",
//                 "ophyd_async": "0.14.0",
//                 "bluesky": "1.14.6"
//             },
//             "scan_id": 23,
//             "plan_type": "generator",
//             "plan_name": "scan",
//             "detectors": [
//                 "det"
//             ],
//             "motors": [
//                 "stage-x"
//             ],
//             "num_points": 51,
//             "num_intervals": 50,
//             "plan_args": {
//                 "detectors": [
//                     "<ophyd_async.sim._point_detector.SimPointDetector object at 0x7f2eb8294da0>"
//                 ],
//                 "num": 51,
//                 "args": [
//                     "<ophyd_async.sim._motor.SimMotor object at 0x7f2eb82c6ba0>",
//                     -10,
//                     10
//                 ],
//                 "per_step": "None"
//             },
//             "hints": {
//                 "dimensions": [
//                     [
//                         [
//                             "stage-x"
//                         ],
//                         "primary"
//                     ]
//                 ]
//             },
//             "plan_pattern": "inner_product",
//             "plan_pattern_module": "bluesky.plan_patterns",
//             "plan_pattern_args": {
//                 "num": 51,
//                 "args": [
//                     "<ophyd_async.sim._motor.SimMotor object at 0x7f2eb82c6ba0>",
//                     -10,
//                     10
//                 ]
//             },
//             "beamline_id": "25-ID-C"
//         }
//     },
//     "data_sources": [],
//     "access_blob": {}
// }

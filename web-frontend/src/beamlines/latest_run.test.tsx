import "@testing-library/jest-dom/vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { vi, describe, it, expect, afterEach } from "vitest";

import { useLatestRun } from "./latest_run";

vi.mock("../tiled/streaming", () => {
  return {
    useTiledWebSocket: () => {
      return { payload: {} };
    },
  };
});
vi.mock("../tiled/search", () => {
  return {
    useSearch: () => {
      return {
        data: [
          {
            id: "my_run_uid",
            attributes: {
              metadata: { start: { uid: "my_run_uid" } },
              ancestors: [],
            },
          },
        ],
      };
    },
  };
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const Run = () => {
  const { run } = useLatestRun();
  return <>{run != null ? run.metadata.start.uid : ""}</>;
};

describe("the useLatestRun() hook", () => {
  it("gets the last run from the API", () => {
    render(<Run></Run>);
    expect(screen.getByText("my_run_uid")).toBeInTheDocument();
  });
  it("updates based on websocket messages", () => {
    return render(<Run></Run>);
  });
});

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

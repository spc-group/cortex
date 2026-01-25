import "@testing-library/jest-dom/vitest";
import axios from "axios";
import type { AxiosInstance } from "axios";
import type { Mock } from "vitest";
import { expect, describe, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { useMetadata } from ".";
import { getMetadata } from "./metadata";
import { useTiledWebSocket } from "./streaming";
import type { RunMetadata } from "../catalog/types";
import { mockUrl, tiledServer } from "../mocks/";

vi.mock("./streaming", async () => {
  return {
    useTiledWebSocket: vi.fn(() => {
      return {
        payload: {
          type: "table-schema",
          sequence: 1,
          key: "primary",
        },
        readyState: 1,
      };
    }),
  };
});

vi.mock("@tanstack/react-query", async () => {
  return {
    // ...(await importOriginal()),
    useQuery: () => ({
      isLoading: false,
      data: {
        attributes: { metadata: { start: { scan_name: "hello" } } },
      },
    }),
  };
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
  tiledServer.resetHandlers();
});

describe("useMetadata() hook", () => {
  const MockComponent = () => {
    const { metadata, isLoading, readyState } =
      useMetadata<RunMetadata>("catalog/scan");
    const runMetadata =
      metadata == null
        ? { start: { scan_name: "" } }
        : metadata.attributes.metadata;
    return (
      <>
        <div>Scan: {runMetadata.start?.scan_name}</div>
        <div>isLoading: {String(isLoading)}</div>
        <div>readyState: {String(readyState)}</div>
      </>
    );
  };
  it("returns http results first ", () => {
    render(<MockComponent />);
    expect(screen.getByText("Scan: hello")).toBeInTheDocument();
  });
  it("returns isLoading from HTTP query", () => {
    render(<MockComponent />);
    expect(screen.getByText("isLoading: false")).toBeInTheDocument();
  });
  it("updates metadata from websocket", () => {
    const newMessage = {
      payload: {
        type: "container-child-metadata-updated",
        key: "scan",
        metadata: {
          start: {
            scan_name: "eggs",
          },
        },
      },
    };
    (useTiledWebSocket as Mock).mockImplementation(() => newMessage);
    render(<MockComponent />);
    expect(screen.getByText("Scan: eggs")).toBeInTheDocument();
  });
});

describe("getMetadata()", () => {
  let client: AxiosInstance;
  beforeEach(() => {
    client = axios.create({ baseURL: mockUrl });
  });
  it("returns the metadata", async () => {
    const md = await getMetadata("79344606-4efc-4fd3-8ee6-de0528e6577b", {
      client: client,
    });
    expect(md.id).toEqual("79344606-4efc-4fd3-8ee6-de0528e6577b");
    expect(md.attributes.metadata.start.uid).toEqual(
      "79344606-4efc-4fd3-8ee6-de0528e6577b",
    );
  });
});

// Example WS message:
// {
//     "type": "container-child-metadata-updated",
//     "key": "b2025651-1836-4d12-80cc-72f4c69355b3",
//     "sequence": 82,
//     "timestamp": "2026-01-23T21:22:16.096555",
//     "specs": [
//         {
//             "name": "BlueskyRun",
//             "version": "3.0"
//         }
//     ],
//     "metadata": {
//         "start": {
//             "uid": "b2025651-1836-4d12-80cc-72f4c69355b3",
//             "time": 1769224922.0758672,
//             "versions": {
//                 "ophyd": "1.11.0",
//                 "ophyd_async": "0.14.0",
//                 "bluesky": "1.14.6"
//             },
//             "scan_id": 4,
//             "plan_type": "generator",
//             "plan_name": "scan",
//             "detectors": [
//                 "pdet",
//                 "bdet"
//             ],
//             "motors": [
//                 "stage-x"
//             ],
//             "num_points": 11,
//             "num_intervals": 10,
//             "plan_args": {
//                 "detectors": [
//                     "<ophyd_async.sim._point_detector.SimPointDetector object at 0x7f511a24e5d0>",
//                     "<ophyd_async.sim._blob_detector.SimBlobDetector object at 0x7f511a214380>"
//                 ],
//                 "num": 11,
//                 "args": [
//                     "<ophyd_async.sim._motor.SimMotor object at 0x7f511a24e060>",
//                     -0.628318,
//                     0.628318
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
//                 "num": 11,
//                 "args": [
//                     "<ophyd_async.sim._motor.SimMotor object at 0x7f511a24e060>",
//                     -0.628318,
//                     0.628318
//                 ]
//             },
//             "beamline_id": "25-ID-C"
//         },
//         "stop": {
//             "uid": "a8743430-9db1-4767-8eac-f48e977827e8",
//             "time": 1769224936.0765219,
//             "run_start": "b2025651-1836-4d12-80cc-72f4c69355b3",
//             "exit_status": "success",
//             "reason": "",
//             "num_events": {
//                 "primary": 11
//             }
//         }
//     }
// }

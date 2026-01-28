import "@testing-library/jest-dom/vitest";
import axios from "axios";
import type { AxiosInstance } from "axios";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Mock } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ReadyState } from "react-use-websocket";
import { useQuery } from "@tanstack/react-query";

import { getArray, useArray, useArrayStats, reduceArrayStats } from "./array";
import { mockUrl, tiledServer } from "../mocks/";
import { useTiledWebSocket } from "./streaming";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
  tiledServer.resetHandlers();
});

vi.mock("./streaming", () => {
  return {
    useTiledWebSocket: vi.fn(() => {
      return {
        type: "array-schema",
      };
    }),
  };
});

vi.mock("./metadata", async () => {
  return {
    useMetadata: () => {
      return {
        metadata: {
          id: "bdet",
          attributes: {
            ancestors: ["7dae9c78-5d88-4127-bfc5-d650d7cd088d", "primary"],
            structure_family: "array",
            specs: [],
            metadata: {},
            structure: {
              data_type: {
                endianness: "not_applicable",
                kind: "u",
                itemsize: 1,
                dt_units: null,
              },
              chunks: [[8], [240], [320]],
              shape: [8, 240, 320],
            },
          },
        },
      };
    },
  };
});
vi.mock("@tanstack/react-query", async () => {
  return {
    // ...(await importOriginal()),
    useQuery: vi.fn(() => {
      return {
        isLoading: false,
        data: [
          [1, 2, 3],
          [4, 5, 6],
        ],
      };
    }),
  };
});

let client: AxiosInstance;
beforeEach(() => {
  client = axios.create({ baseURL: mockUrl });
});

describe("getArray() function", () => {
  it("returns slices", async () => {
    const array = await getArray("my_run/primary/bdet", [0, 1], {
      client: client,
    });
    expect(array.length).toEqual(2);
  });
});

describe("useArray", () => {
  const MockComponent = (
    { slices }: { slices: number[] | null } = { slices: [0] },
  ) => {
    const { array, shape, endianness, kind, itemsize, readyState } = useArray(
      "my_run/primary/bdet",
      slices,
    );
    return (
      <>
        <div>Array: {array}</div>
        <div>Shape: {shape.map((len) => `${len},`)}</div>
        <div>Endianness: {endianness}</div>
        <div>Kind: {kind}</div>
        <div>Itemsize: {itemsize}</div>
        <div>readyState: {readyState}</div>
      </>
    );
  };
  it("returns all array frames by default", () => {
    render(<MockComponent slices={null} />);
    expect(screen.getByText("Array: 123456")).toBeInTheDocument();
    // Check which slices were requested by inspecting the query key
    const lastKey = (useQuery as Mock).mock.lastCall?.[0].queryKey;
    const allSlices = [0, 1, 2, 3, 4, 5, 6, 7];
    expect(lastKey.slice(2)).toEqual(allSlices);
  });

  it("returns the requested array frame", () => {
    render(<MockComponent slices={null} />);
    expect(screen.getByText("Array: 123456")).toBeInTheDocument();
  });
  it("returns array metadata from HTTP", () => {
    render(<MockComponent slices={null} />);
    expect(screen.getByText("Shape: 8,240,320,")).toBeInTheDocument();
    expect(screen.getByText("Endianness: not_applicable")).toBeInTheDocument();
    expect(screen.getByText("Kind: u")).toBeInTheDocument();
    expect(screen.getByText("Itemsize: 1")).toBeInTheDocument();
  });
  it("updates the shape from websockets", () => {
    const newMessage = {
      payload: {
        type: "array-ref",
        data_source: {
          structure: {
            shape: [25, 240, 320],
          },
        },
      },
      readyState: ReadyState.OPEN,
    };
    (useTiledWebSocket as Mock).mockImplementation(() => newMessage);
    render(<MockComponent slices={null} />);
    expect(screen.getByText("Shape: 25,240,320,")).toBeInTheDocument();
    expect(screen.getByText("readyState: 1")).toBeInTheDocument();
  });
});

describe("useArrayStats", () => {
  const MockComponent = () => {
    const { max, min, sum } = useArrayStats("my_run/primary/bdet", {
      client: client,
    });
    return (
      <>
        <div>Max: {JSON.stringify(max)}</div>
        <div>Min: {JSON.stringify(min)}</div>
        <div>Sum: {JSON.stringify(sum)}</div>
      </>
    );
  };
  it("calculates the stats", () => {
    render(<MockComponent />);
    // They're all null on the first pass, need to figure out a better test
    expect(
      screen.getByText(`Sum: [${Array(25).fill("null").join(",")}]`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Min: [${Array(25).fill("null").join(",")}]`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Max: [${Array(25).fill("null").join(",")}]`),
    ).toBeInTheDocument();
  });
});

describe("the arrayStatsReducer() function", () => {
  it("updates the shape state", () => {
    const oldStats = {
      sum: [],
      max: [],
      min: [],
      shape: [],
    };
    const action = {
      type: "update_shape",
      shape: [3, 1024, 1024],
      index: 0,
      data: [],
    };
    const newStats = reduceArrayStats(oldStats, action);
    expect(newStats.shape).toEqual([3, 1024, 1024]);
  });
  it("creates empty arrays", () => {
    const oldStats = {
      sum: [],
      max: [],
      min: [],
      shape: [1],
    };
    const action = {
      type: "update_shape",
      shape: [3, 1024, 1024],
      data: [] as number[][],
      index: 0,
    };
    const newStats = reduceArrayStats(oldStats, action);
    expect(newStats.sum).toEqual([null, null, null]);
    expect(newStats.max).toEqual([null, null, null]);
    expect(newStats.min).toEqual([null, null, null]);
  });
  it("extends existing arrays", () => {
    const oldStats = {
      sum: [null, null],
      max: [null],
      min: [],
      shape: [],
    };
    const action = {
      type: "update_shape",
      shape: [3, 1024, 1024],
      data: [] as number[][],
      index: 0,
    };
    const newStats = reduceArrayStats(oldStats, action);
    expect(newStats.sum).toEqual([null, null, null]);
    expect(newStats.max).toEqual([null, null, null]);
    expect(newStats.min).toEqual([null, null, null]);
  });
  it("adds new slice stats", () => {
    const oldStats = {
      sum: [null],
      max: [null],
      min: [null],
      shape: [1],
    };
    const action = {
      type: "add_slice",
      data: [[1, 2, 3]],
      index: 0,
      shape: [] as number[],
    };
    const newStats = reduceArrayStats(oldStats, action);
    expect(newStats.sum).toEqual([6]);
    expect(newStats.max).toEqual([3]);
    expect(newStats.min).toEqual([1]);
  });
  // it("goes fast (vrooom!)", () => {
  //   const oldStats = {
  //     sum: [null],
  //     max: [null],
  //     min: [null],
  //     shape: [1],
  //   };
  //   const [nCol, nRow] = [2048, 1840];
  //   const sliceData = [...Array(nRow).keys()].map((row) => {
  //     return [...Array(nCol).keys()].map((col) => col + nCol * nRow);
  //   });
  //   const action = {
  //     type: "add_slice",
  //     data: sliceData,
  //     index: 0,
  //     shape: [] as number[],
  //   };
  //   const t0 = performance.now();
  //   const newStats = reduceArrayStats(oldStats, action);
  //   const runTime = performance.now() - t0;
  //   expect(runTime).toBeLessThan(100);
  // });
});

// // {"detail":"None of the media types requested by the client are supported. Supported: text/plain, image/tiff, image/png, text/csv, text/x-comma-separated-values, application/octet-stream, application/vnd.ms-excel, application/json, text/html. Requested: blah."}%

// Websocket message return when new array frame is written
// {
//     "type": "array-ref",
//     "sequence": 51,
//     "timestamp": "2026-01-22T23:20:58.964160",
//     "data_source": {
//         "id": 30,
//         "structure_family": "array",
//         "structure": {
//             "data_type": {
//                 "endianness": "not_applicable",
//                 "kind": "u",
//                 "itemsize": 1,
//                 "dt_units": null
//             },
//             "chunks": [
//                 [
//                     51
//                 ],
//                 [
//                     240
//                 ],
//                 [
//                     320
//                 ]
//             ],
//             "shape": [
//                 51,
//                 240,
//                 320
//             ],
//             "dims": null,
//             "resizable": false
//         },
//         "mimetype": "application/x-hdf5",
//         "parameters": {
//             "dataset": "/entry/data/data",
//             "swmr": true
//         },
//         "assets": [
//             {
//                 "data_uri": "file://localhost/tmp/tmp6m063kb6/17346ccd-7327-4074-8e6c-3117ee053d72.h5",
//                 "is_directory": false,
//                 "parameter": "data_uris",
//                 "num": 0,
//                 "id": null
//             }
//         ],
//         "management": "external"
//     },
//     "patch": null,
//     "shape": [
//         51,
//         240,
//         320
//     ],
//     "uri": "http://localhost:8000/api/v1/array/full/4dcfbe03-ed78-4d5c-9f54-ceddd4f3fc07/primary/bdet?slice=:51,:240,:320"
// }

import "@testing-library/jest-dom/vitest";
import axios from "axios";
import type { AxiosInstance } from "axios";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Mock } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ReadyState } from "react-use-websocket";
import { useQuery } from "@tanstack/react-query";

import { getArray, useArray } from "./array";
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
        data: [1, 2, 3],
      };
    }),
  };
});

describe("getArray() function", () => {
  let client: AxiosInstance;
  beforeEach(() => {
    client = axios.create({ baseURL: mockUrl });
  });
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
    expect(screen.getByText("Array: 123")).toBeInTheDocument();
    // Check which slices were requested by inspecting the query key
    const lastKey = (useQuery as Mock).mock.lastCall?.[0].queryKey;
    const allSlices = [0, 1, 2, 3, 4, 5, 6, 7];
    expect(lastKey.slice(2)).toEqual(allSlices);
  });

  it("returns the requested array frame", () => {
    render(<MockComponent slices={null} />);
    expect(screen.getByText("Array: 123")).toBeInTheDocument();
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

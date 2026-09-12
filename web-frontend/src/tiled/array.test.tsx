import * as zarr from "zarrita";
import "@testing-library/jest-dom/vitest";
import { describe, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { useArrayData } from "./array";
import { TiledProvider } from "./provider";
import { tiledServer } from "../mocks/";

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
              shape: [2, 3, 1],
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

let root: zarr.Location<zarr.Mutable>;
beforeEach(async () => {
  root = zarr.root(new Map());
  await zarr.create(root);
  await zarr.create(root.resolve("spam"), {
    data_type: "int32",
    shape: [11, 24, 32],
    chunk_shape: [1, 24, 32],
  });
  const bigIntZArray = await zarr.create(root.resolve("bigint"), {
    data_type: "int64",
    shape: [3],
    chunk_shape: [3],
  });
  zarr.set(bigIntZArray, null, {
    data: new BigInt64Array([1n, 2n, 3n]),
    shape: [3],
    stride: [1],
  });
  const bigUintZArray = await zarr.create(root.resolve("biguint"), {
    data_type: "uint64",
    shape: [3],
    chunk_shape: [3],
  });
  zarr.set(bigUintZArray, null, {
    data: new BigUint64Array([1n, 2n, 3n]),
    shape: [3],
    stride: [1],
  });
});

describe("the useArrayData() hook", () => {
  const MockComponent = ({ slice }: { slice?: null | number | zarr.Slice }) => {
    const array = useArrayData("spam", slice);
    return (
      <>
        <div>Length: {array?.data?.length}</div>
        <div>Type: {array?.data?.constructor.name}</div>
      </>
    );
  };
  it("loads all data", async () => {
    render(
      <TiledProvider zarrRoot={root}>
        <MockComponent slice={null} />
      </TiledProvider>,
    );
    await screen.findByText("Length: 8448");
  });
  it("loads a single slice", async () => {
    render(
      <TiledProvider zarrRoot={root}>
        <MockComponent slice={3} />
      </TiledProvider>,
    );
    await screen.findByText("Length: 768");
  });
  it("loads multiple slices", async () => {
    render(
      <TiledProvider zarrRoot={root}>
        <MockComponent slice={zarr.slice(2, 4)} />
      </TiledProvider>,
    );
    await screen.findByText("Length: 1536");
  });
  it("converts big int arrays to regular int", async () => {
    const Component = () => {
      const array = useArrayData("bigint", null);
      return <div>Type: {array?.data?.constructor.name}</div>;
    };
    render(
      <TiledProvider zarrRoot={root}>
        <Component></Component>
      </TiledProvider>,
    );
    await screen.findByText("Type: Int32Array");
  });
  it("converts big Uint arrays to regular int", async () => {
    const Component = () => {
      const array = useArrayData("biguint", null);
      return <div>Type: {array?.data?.constructor.name}</div>;
    };
    render(
      <TiledProvider zarrRoot={root}>
        <Component></Component>
      </TiledProvider>,
    );
    await screen.findByText("Type: Uint32Array");
  });
});

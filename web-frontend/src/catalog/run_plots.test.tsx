// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import "@testing-library/jest-dom/vitest";
import * as zarr from "zarrita";
import * as React from "react";
import { vi, expect, describe, beforeEach, afterEach, it } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Table } from "apache-arrow";
import { ReadyState } from "react-use-websocket";

import mockMetadata from "../mocks/run_metadata.json";
import { RunPlots, ArrayPlots } from "./run_plots.tsx";
import { TiledProvider } from "../tiled";

vi.mock("../tiled/metadata", () => {
  return {
    useMetadata: () => {
      return { metadata: mockMetadata.data };
    },
  };
});
vi.mock("../tiled/streaming", () => {
  return {
    useTiledWebSocket: () => {
      return {
        type: "array-schema",
        shape: null,
      };
    },
  };
});
vi.mock("../tiled/use_streams", () => {
  return {
    useStreams: () => {
      return {
        streams: {
          baseline: {
            data_keys: { "It-count": {}, bdet: { shape: [5, 3, 19] } },
            ancestors: [],
            hints: { fields: ["bdet"] },
          },

          primary: {
            data_keys: {
              "It-count": {},
              bdet: {},
            },
            ancestors: [],
          },
        },
      };
    },
  };
});
vi.mock("../tiled/use_data_keys", () => {
  return {
    useDataKeys: () => {
      return { sim_motor_2: {} };
    },
  };
});
vi.mock("../tiled/use_data_table", () => {
  return {
    useDataTable: () => {
      return {
        table: new Table(),
        readyState: ReadyState.OPEN,
      };
    },
  };
});

let root;
beforeEach(async () => {
  // Use an in-memory zarr store for testing data fetching
  root = zarr.root(new Map());
  await zarr.create(root);
  await zarr.create(root.resolve("spam"), {
    data_type: "int32",
    shape: [11],
    chunk_shape: [11],
  });
  const zarray = await zarr.create(root.resolve("eggs"), {
    data_type: "int32",
    shape: [11, 24, 32],
    chunk_shape: [1, 24, 32],
  });
  for (let i = 0; i < zarray.shape[0]; i++) {
    zarr.set(zarray, [i, null, null], i);
  }
  await zarr.create(root.resolve("12345-6789/primary/bdet"), {
    data_type: "int32",
    shape: [11, 24, 32],
    chunk_shape: [1, 24, 32],
  });
});

// vi.mock("../tiled/array", () => {
//   return {
//     useArray: () => {
//       return {
//         array: [],
//         readyState: ReadyState.OPEN,
//       };
//     },
//     useArrayStats: () => {
//       return {
//         stats: [],
//         readyState: ReadyState.OPEN,
//       };
//     },
//   };
// });

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe("the RunPlots component", () => {
  const run = {
    uid: 5,
    metadata: { start: {} },
  };
  const Component = () => {
    const queryClient = new QueryClient();
    return (
      <TiledProvider zarrRoot={root}>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <RunPlots run={run} />
          </QueryClientProvider>
        </BrowserRouter>
      </TiledProvider>
    );
  };
  it("derives axis labels", async () => {
    const user = userEvent.setup();
    render(<Component />);
    await user.click(screen.getByLabelText("Hinted Only"));
    const selectBoxes = screen.getAllByTestId("select-signal");
    await user.selectOptions(selectBoxes[0], "It-count");
    const numSignals = 3; // x, signal, and reference
    expect(screen.getAllByRole("option", { name: "It-count" })).toHaveLength(
      numSignals,
    );
  });
  it("shows array components", async () => {
    const user = userEvent.setup();
    render(<Component />);
    await user.click(screen.getByLabelText("Hinted Only"));
    const selectBoxes = screen.getAllByTestId("select-signal");
    console.log(selectBoxes[0].options);
    await user.selectOptions(selectBoxes[0], "bdet");
    expect(screen.getByRole("heading", { name: "bdet" })).toBeInTheDocument();
  });
  it("only shows each array once", async () => {
    const user = userEvent.setup();
    render(<Component />);
    await user.click(screen.getByLabelText("Hinted Only"));
    const selectBoxes = screen.getAllByTestId("select-signal");
    await user.selectOptions(selectBoxes[0], "bdet");
    await user.selectOptions(selectBoxes[1], "bdet");
    expect(screen.getAllByRole("heading", { name: "bdet" })).toHaveLength(1);
  });
  // it("sorts the primary stream to be first", () => {
  //   const select = screen.getByTitle("Select a data stream");
  //   expect(select.children[0].textContent).toEqual("primary");
  // });
  // it("sorts the
});

describe("the ArrayPlots component", () => {
  const ArrayComponent = ({ name }: { name?: string }) => {
    const source = {
      path: "12345-6789/primary/bdet",
      name: name,
    };
    return (
      <TiledProvider zarrRoot={root}>
        <ArrayPlots source={source} signal="bdet" />
      </TiledProvider>
    );
  };
  afterEach(() => {
    localStorage.removeItem("rois");
  });
  it("shows the 'live' badge", () => {
    render(<ArrayComponent />);
    expect(screen.getByText("Live")).toBeInTheDocument();
  });
  it("shows the dataset name if provided", () => {
    render(<ArrayComponent name="Binary Detector" />);
    expect(screen.getByText("Binary Detector")).toBeInTheDocument();
  });
  it("shows the dataset path if unnamed", () => {
    render(<ArrayComponent />);
    expect(screen.getByText("12345-6789/primary/bdet")).toBeInTheDocument();
  });

  // it("sets ROI names", async () => {
  //   expect(screen.queryAllByRole("row")).toHaveLength(1);
  //   const addButton = screen.getByText("Add ROI");
  //   await fireEvent.click(addButton);
  //   const nameInput = screen.getByPlaceholderText("ROI Name…");
  //   await fireEvent.change(nameInput, {currentTarget: {value: "Hello"}});
  //   expect(screen.queryAllByRole("row")).toHaveLength(1);
  // });
});

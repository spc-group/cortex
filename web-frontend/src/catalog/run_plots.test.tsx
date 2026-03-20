// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import "@testing-library/jest-dom/vitest";
import * as zarr from "zarrita";
import * as React from "react";
import { vi, expect, describe, beforeEach, afterEach, it } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Table } from "apache-arrow";
import { ReadyState } from "react-use-websocket";

import mockMetadata from "../mocks/run_metadata.json";
import { RunPlots, StreamPlots, ArrayPlots } from "./run_plots.tsx";
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
            data_keys: {},
            ancestors: [],
          },

          primary: {
            data_keys: {},
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
  beforeEach(async () => {
    const queryClient = new QueryClient();
    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <RunPlots run={run} />
        </QueryClientProvider>
      </BrowserRouter>,
    );
  });
  it("doesn't crash", () => {});
  it("sorts the primary stream to be first", () => {
    const select = screen.getByTitle("Select a data stream");
    expect(select.children[0].textContent).toEqual("primary");
  });
});

const stream: Stream = {
  key: "primary",
  data_keys: { sim_motor_2: {} },
  ancestors: [],
  hints: {
    sim_motor_2: {
      fields: ["sim_motor_2"],
    },
  },
};

describe("the StreamPlots component", () => {
  beforeEach(async () => {
    cleanup();
    await render(
      <StreamPlots uid={5} stream={stream} runHints={["sim_motor_2"]} />,
    );
  });
  it("populates signal pickers", () => {
    expect(screen.getAllByText("sim_motor_2").length).toEqual(3);
  });
  it("adds 'seq_num' and 'time' signals when unhinted", async () => {
    expect(screen.queryAllByText("seq_num")).toHaveLength(0);
    expect(screen.queryAllByText("time")).toHaveLength(0);
    const checkbox = screen.getByLabelText("Hints only");
    // await fireEvent.change(checkbox, {target: {checked: false}});
    await fireEvent.click(checkbox);
    await screen.findAllByText("seq_num");
    await screen.findAllByText("time");
    expect(screen.getAllByText("seq_num").length).toEqual(3);
    expect(screen.getAllByText("time").length).toEqual(3);
  });
  it("adds ROIs", async () => {
    localStorage.setItem(
      "rois",
      JSON.stringify({
        sim_motor_2: [
          {
            name: "Ni-KL",
            isActive: true,
            x0: 0,
            x1: 3,
            y0: 5,
            y1: 10,
          },
        ],
      }),
    );
    render(<StreamPlots uid={5} stream={stream} />);
    await screen.findAllByText("sim_motor_2 – Ni-KL");
  });
  it("adds and removes ROIs", async () => {
    expect(screen.queryAllByRole("row")).toHaveLength(1);
    const addButton = screen.getByText("Add ROI");
    await fireEvent.click(addButton);
    expect(screen.queryAllByRole("row")).toHaveLength(2);
    const removeButton = screen.getByTitle("Remove ROI 0");
    await fireEvent.click(removeButton);
    expect(screen.queryAllByRole("row")).toHaveLength(1);
  });
});

describe("the ArrayPlots component", () => {
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
    await render(
      <TiledProvider zarrRoot={root}>
        <ArrayPlots source={{}} signal="bdet" />
      </TiledProvider>,
    );
  });
  afterEach(() => {
    localStorage.removeItem("rois");
  });
  it("shows the 'live' badge", () => {
    expect(screen.getByText("Live")).toBeInTheDocument();
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

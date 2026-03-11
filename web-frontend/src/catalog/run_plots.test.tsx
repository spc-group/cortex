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
    await React.act(async () => {
      render(
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <RunPlots run={run} />
          </QueryClientProvider>
        </BrowserRouter>,
      );
    });
  });
  it("doesn't crash", () => {});
  it("sorts the primary stream to be first", () => {
    const select = screen.getByTitle("Select a data stream");
    expect(select.children[0].textContent).toEqual("primary");
  });
});

describe("the StreamPlots component", () => {
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
  beforeEach(async () => {
    await renderRouter(<StreamPlots uid={5} stream={stream} />);
  });
  it("populates signal pickers", () => {
    expect(screen.getAllByText("sim_motor_2").length).toEqual(3);
  });
  // it("adds 'seq_num' and 'time' signals when unhinted", async () => {
  //   const checkbox = screen.getByLabelText("Hints only");
  //   await fireEvent.change(checkbox, {target: {checked: false}});
  //   expect(screen.getAllByText("seq_num").length).toEqual(3);
  //   expect(screen.getAllByText("time").length).toEqual(3);
  // });
  it("skips 'seq_num' and 'time' signals when hinted", () => {
    expect(screen.queryByText("seq_num")).toBeNull();
    expect(screen.queryByText("time")).toBeNull();
  });
});

const renderRouter = async (element) => {
  const queryClient = new QueryClient();
  await React.act(async () => {
    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          {element}
        </QueryClientProvider>
      </BrowserRouter>,
    );
  });
};

describe("the ArrayPlots component", () => {
  let root;
  beforeEach(async () => {
    const stream = {
      ancestors: ["12345-6789"],
      key: "primary",
    };
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
    await renderRouter(
      <TiledProvider zarrRoot={root}>
        <ArrayPlots stream={stream} signal="bdet" />
      </TiledProvider>,
    );
  });
  afterEach(() => {
    localStorage.removeItem("rois-bdet");
  });
  it("shows the 'live' badge", () => {
    expect(screen.getByText("Live")).toBeInTheDocument();
  });
  it("adds an ROI", async () => {
    const button = screen.getByText("Add ROI");
    expect(screen.queryAllByRole("row")).toHaveLength(2);
    await fireEvent.click(button);
    expect(screen.queryAllByRole("row")).toHaveLength(3);
  });
  it("removes ROIs", async () => {
    expect(screen.queryAllByRole("row")).toHaveLength(2);
    const addButton = screen.getByText("Add ROI");
    await fireEvent.click(addButton);
    expect(screen.queryAllByRole("row")).toHaveLength(3);
    const removeButton = screen.getByTitle("Remove ROI 1");
    await fireEvent.click(removeButton);
    expect(screen.queryAllByRole("row")).toHaveLength(2);
  });
});

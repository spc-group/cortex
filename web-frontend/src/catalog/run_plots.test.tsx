// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import "@testing-library/jest-dom/vitest";
import * as React from "react";
import { vi, expect, describe, beforeEach, afterEach, it } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Table } from "apache-arrow";
import { ReadyState } from "react-use-websocket";

import mockMetadata from "../mocks/run_metadata.json";
import { RunPlots, StreamPlots, DataPlots } from "./run_plots.tsx";

vi.mock("../tiled/metadata", () => {
  return {
    useMetadata: () => {
      return { metadata: mockMetadata.data };
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
afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe("the RunPlots component", () => {
  beforeEach(async () => {
    const queryClient = new QueryClient();
    await React.act(async () => {
      render(
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <RunPlots uid={"5"} />
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

describe("the RunDataPlots component", () => {
  beforeEach(async () => {
    const stream = {
      ancestors: ["12345-6789"],
    };
    await renderRouter(<DataPlots stream={stream} />);
  });
  it("shows the 'live' badge", () => {
    expect(screen.getByText("Live")).toBeInTheDocument();
  });
});

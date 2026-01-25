import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, expect, describe, beforeEach, it } from "vitest";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { BrowserRouter } from "react-router";
import { Table } from "apache-arrow";

import mockMetadata from "../mocks/run_metadata.json";
import { LivePlot } from "./liveplot";

vi.mock("./latest_run", async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useLatestRun: () => {
      return {
        run: {
          key: "b68c7712-cb05-47f4-8e25-11cb05cc2cd5",
          metadata: {
            start: { uid: "b68c7712-cb05-47f4-8e25-11cb05cc2cd5" },
          },
        },
      };
    },
  };
});
vi.mock("../tiled/use_streams", () => {
  return {
    useStreams: () => {
      return {
        streams: {
          primary: {
            data_keys: {},
            ancestors: ["b68c7712-cb05-47f4-8e25-11cb05cc2cd5"],
          },
        },
      };
    },
  };
});
vi.mock("../tiled/metadata", () => {
  return {
    useMetadata: () => {
      return { metadata: mockMetadata.data };
    },
  };
});
vi.mock("../tiled/use_data_table", () => {
  return {
    useDataTable: () => {
      return { table: new Table() };
    },
  };
});

describe("the livePlot component", () => {
  beforeEach(async () => {
    // Render the component
    const queryClient = new QueryClient();
    await act(() => {
      render(
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <LivePlot beamlineId="25-ID-C" />
          </QueryClientProvider>
        </BrowserRouter>,
      );
      // await waitFor(() => expect(screen.getByText("streaming_node")).toBeInTheDocument());
    });
  });
  it("shows the new run UID", () => {
    expect(
      screen.getByText("b68c7712-cb05-47f4-8e25-11cb05cc2cd5"),
    ).toBeInTheDocument();
  });
});

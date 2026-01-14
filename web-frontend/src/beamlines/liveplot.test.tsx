import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, expect, describe, beforeEach, it } from "vitest";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { BrowserRouter } from "react-router";

import { LivePlot } from "./liveplot";

beforeEach(() => {
  vi.mock("../tiled/use_latest_run", async (importOriginal) => {
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
            },
          },
        };
      },
    };
  });
  vi.mock("../tiled/use_metadata", () => {
    return {
      useMetadata: () => {
        return { data: { "start.scan_name": "my run" } };
      },
    };
  });
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
      screen.getByText("UID: b68c7712-cb05-47f4-8e25-11cb05cc2cd5"),
    ).toBeInTheDocument();
  });
});

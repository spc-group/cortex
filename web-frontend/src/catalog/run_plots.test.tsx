// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import * as React from "react";
import { Blob } from "buffer";
import { encode } from "@msgpack/msgpack";
import { vi, expect, describe, beforeEach, afterEach, it } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { RunPlots, RunDataPlots } from "./run_plots.tsx";

// Mock API response
// https://github.com/vitest-dev/vitest/discussions/3589
beforeEach(() => {
  vi.mock("@tanstack/react-query", async (importOriginal) => {
    return {
      ...(await importOriginal()),
      useQuery: () => ({
	isLoading: false,
	error: null,
	data: { uid: "hello" },
      }),
    };
  });  
  vi.mock(import("../tiled/use_streams"), () => {
    return {
      useStreams: () => {
	return {streams: ["primary"]};
      },
    };
  });
  vi.mock(import("../tiled/use_data_keys"), () => {
    return {
      useDataKeys: () => {
	return {streams: ["primary"]};
      },
    };
  });
  vi.mock(import("../tiled/streaming"), () => {
    return {
      useLatestData: () => {
	return {readyState: 1};
      },
    };
  });  
});
afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe("the RunPlots component", () => {
  const socket = vi.fn();
  beforeEach(async () => {
    const queryClient = new QueryClient();
    await React.act(async () => {
      render(
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <RunPlots uid={5} />
          </QueryClientProvider>
        </BrowserRouter>,
      );
    });
  });
  it("shows run details", () => {
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});

describe("the RunDataPlots component", () => {
  beforeEach(async () => {
    const queryClient = new QueryClient();
    await React.act(async () => {
      render(
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <RunDataPlots uid={5} />
          </QueryClientProvider>
        </BrowserRouter>,
      );
    });    
  })
  it("shows the 'live' badge", () => {
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

});

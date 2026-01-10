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

import { RunPlots } from "./run_plots.tsx";

// Mock API response
// https://github.com/vitest-dev/vitest/discussions/3589
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

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe("the RunPlots component", () => {
  const socket = vi.fn();
  const mockWebSocket = (payload) => {
    const encoded: Uint8Array = encode(payload);
    const blob = new Blob([encoded]);
    const wsResponse = {
      data: blob,
    };
    socket.mockReturnValue({ lastMessage: wsResponse, readyState: 1 });
  };
  beforeEach(async () => {
    const queryClient = new QueryClient();
    mockWebSocket({ sequence: 1 });
    await React.act(async () => {
      render(
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <RunPlots uid={5} webSocketHook={socket} />
          </QueryClientProvider>
        </BrowserRouter>,
      );
    });
  });
  it("shows run details", () => {
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
  it("shows the 'live' badge", () => {
    mockWebSocket({ key: "b68c7712-cb05-47f4-8e25-11cb05cc2cd5", sequence: 1 });
    expect(screen.getByText("Live")).toBeInTheDocument();
  });
});

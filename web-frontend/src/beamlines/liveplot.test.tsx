import { Blob } from "buffer";
import { encode } from "@msgpack/msgpack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, expect, describe, beforeEach, it } from "vitest";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { BrowserRouter } from "react-router";

import { LivePlot } from "./liveplot";

describe("the livePlot component", () => {
  const socket = vi.fn();
  const mockWebSocket = (payload: object) => {
    const encoded: Uint8Array = encode(payload);
    const blob = new Blob([encoded]);
    const wsResponse = {
      data: blob,
    };
    socket.mockReturnValue({ lastMessage: wsResponse, readyState: 1 });
  };
  beforeEach(async () => {
    // Mock the websocket connection
    mockWebSocket({ key: "b68c7712-cb05-47f4-8e25-11cb05cc2cd5", sequence: 1 });
    // Render the component
    const queryClient = new QueryClient();
    await act(() => {
      render(
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <LivePlot webSocketHook={socket} beamlineId="25-ID-C" />
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

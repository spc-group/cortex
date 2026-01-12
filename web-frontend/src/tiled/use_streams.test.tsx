import "@testing-library/jest-dom/vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

import { useStreams } from "./use_streams";

beforeEach(() => {
  vi.mock("@tanstack/react-query", async (importOriginal) => {
    return {
      ...(await importOriginal()),
      useQuery: () => ({
        data: ["primary"],
      }),
    };
  });
  vi.mock("react-use-websocket", async (importOriginal) => {
    return {
      default: () => ({
        lastMessage: {sequence: 1},
        readyState: 1,
      }),
    };
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const doRender = (elem)=>{
  const queryClient = new QueryClient();
  return  render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {elem}
      </QueryClientProvider>
    </BrowserRouter>,
  );
};

const StreamsComponent = ({uid}) => {
  const {streams} = useStreams(uid);
  return (
    streams.map((stream) => <div key="stream">{stream}</div>)
  );
};

describe("useStreams() hook", () => {
  it("returns stream names", async () => {
    await act(() => {
      doRender(
        <StreamsComponent uid="new_run" />
      );
    });
    expect(screen.getByText("primary")).toBeInTheDocument();
  });
});

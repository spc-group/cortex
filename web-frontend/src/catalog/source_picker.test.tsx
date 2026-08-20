import "@testing-library/jest-dom/vitest";
import { vi, describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
// import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { SingleRunPicker, SignalPicker } from "./source_picker.tsx";

afterEach(() => {
  cleanup();
});

vi.mock("@tanstack/react-query", async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useQuery: () => ({
      data: {
        baseline: {},
      },
      isLoading: false,
    }),
  };
});
vi.mock("./streaming", async () => {
  return {
    useTiledWebSocket: () => ({
      payload: {
        type: "container-child-created",
        sequence: 1,
        key: "primary",
      },
      readyState: 1,
    }),
  };
});
vi.mock("../tiled", async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useStreams: () => ({
      streams: {
        baseline: {
          data_keys: {},
          ancestors: [],
        },
        primary: {
          data_keys: {
            "I0-count": {},
          },
          ancestors: [],
        },
      },
    }),
  };
});

describe("the SingleRunPicker() component", () => {
  const Component = () => {
    const run = {
      uid: "new_run",
      path: "new_run",
      structure_family: "container",
      specs: [],
      metadata: {
        start: { time: 0, uid: "1234556" },
      },
      structure: {},
    };
    const queryClient = new QueryClient();
    return (
      <QueryClientProvider client={queryClient}>
        <SingleRunPicker run={run} setLineData={() => {}} />,
      </QueryClientProvider>
    );
  };

  it("adds and drops rows", async () => {
    render(<Component />);
    let rows = screen.getAllByRole("row");
    expect(rows.length).toEqual(2);
    // Add a row
    const addButton = screen.getByText("+", { selector: "button" });
    await fireEvent.click(addButton);
    rows = screen.getAllByRole("row");
    expect(rows.length).toEqual(3);
    // Remove a row
    const dropButton = screen.getByText("−", { selector: "button" });
    await fireEvent.click(dropButton);
    rows = screen.getAllByRole("row");
    expect(rows.length).toEqual(2);
  });
  it("lists streams", () => {
    render(<Component />);
    const primaryOptions = screen.getAllByText("primary/");
    expect(primaryOptions).toHaveLength(3);
    const baselineOptions = screen.getAllByText("baseline/");
    expect(baselineOptions).toHaveLength(3);
  });
  it("lists data keys", async () => {
    const stream = {
      data_keys: {
        "I0-count": {
          dtype: "float32",
          shape: [101],
        },
      },
      ancestors: [],
      structure_family: "container",
      specs: [],
      configuration: {},
      hints: {},
      time: 0,
      uid: "12345",
      key: "primary",
    };
    render(<SignalPicker stream={stream} hints={[]} useHints={false} />);
    await screen.findByText("I0-count");
  });
});

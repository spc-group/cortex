import "@testing-library/jest-dom/vitest";
import { vi, describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { useRuns } from ".";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

vi.mock("../tiled/search", async () => {
  return {
    useSearch: vi.fn(() => {
      return {
        data: [
          {
            id: "23456",
            attributes: {
              metadata: { start: { uid: "98765-4321" } },
              ancestors: [],
            },
          },
        ],
      };
    }),
  };
});

describe("useRuns() hook", () => {
  const MockComponent = () => {
    const { runs } = useRuns({
      sortField: "",
      pageLimit: 100,
      pageOffset: 0,
      filters: [],
    });
    return (
      <>
        <div>Count: {runs.length}</div>
        <div>Run0 UID: {runs[0].uid}</div>
      </>
    );
  };

  it("converts nodes to run objects", () => {
    render(<MockComponent />);
    expect(screen.getByText("Count: 1")).toBeInTheDocument();
    expect(screen.getByText("Run0 UID: 98765-4321")).toBeInTheDocument();
  });
});

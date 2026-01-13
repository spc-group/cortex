import "@testing-library/jest-dom/vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import {vi, describe, it, expect, beforeEach, afterEach } from "vitest";

import {useLatestRun} from ".";

beforeEach(() => {
  vi.mock("./streaming", () => {
    return {
      useTiledWebSocket: () => {
	return {payload: {}}
      },
    };
  });
  vi.mock("./use_runs", () => {
    return {
      useRuns: () => {
	return {
	  runs: [{metadata: {"start.uid": "my_run_uid"}}],
	}
      },
    };
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const Run = () => {
  const { uid } = useLatestRun();
  return (
    <>{uid}</>
  );
};


describe("the useLatestRun() hook", () => {
  it("gets the last run from the API", () => {
    render(<Run></Run>);
    expect(screen.getByText("my_run_uid")).toBeInTheDocument();
  });
  it("updates based on websocket messages", () => {
    vi.mock(import("./streaming"), () => {
      return {
        useTiledWebSocket: () => {
          return {payload: {sequence: 1}}
        },
      };
    });
    return render(<Run></Run>);
  });
});

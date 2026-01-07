import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReadyState } from "react-use-websocket";
import LivePlot from "./liveplot.tsx";

vi.mock("./latest_run.tsx", () => ({
  useLatestRun: vi.fn(() => {
    return [
      {
        "start.uid": "12345-6939",
        "start.plan_name": "xafs_scan",
        "start.time": new Date(2025, 10, 2, 23, 45),
      },
      ReadyState.OPEN,
    ];
  }),
}));

describe("live plot component", () => {
  it("has a heading widget", () => {
    render(<LivePlot beamlineId="25-ID-C" />);
    expect(screen.getByText("12345-6939")).toBeInTheDocument();
    expect(screen.getByText("xafs_scan")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Sun Nov 02 2025 23:45:00 GMT+0000 (Coordinated Universal Time)",
      ),
    ).toBeInTheDocument();
  });
});

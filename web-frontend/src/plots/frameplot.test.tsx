import "@testing-library/jest-dom/vitest";
import { useState } from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

import { RangePicker } from "./frameplot";

afterEach(() => {
  cleanup();
});

const Component = () => {
  const [top, setTop] = useState(10);
  const [bottom, setBottom] = useState(5);
  return (
    <>
      <RangePicker
        min={0}
        max={100}
        top={top}
        bottom={bottom}
        setTop={setTop}
        setBottom={setBottom}
      />
      <div>Top: {top}</div>
      <div>Bottom: {bottom}</div>
    </>
  );
};

describe("the RangePicker() component", () => {
  it("renders", () => {
    render(<Component />);
  });
  it("sets top and bottom", async () => {
    render(<Component />);
    const topInput = screen.getByLabelText("Max:");
    await fireEvent.change(topInput, { target: { value: 15 } });
    const bottomInput = screen.getByLabelText("Min:");
    await fireEvent.change(bottomInput, { target: { value: 2 } });
    // Check that state was updated
    expect(screen.getByText("Top: 15")).toBeInTheDocument();
    expect(screen.getByText("Bottom: 2")).toBeInTheDocument();
  });
  it("keeps the top above the bottom", async () => {
    render(<Component />);
    expect(screen.getByText("Top: 10")).toBeInTheDocument();
    // Move the bottom above the old top and check that top got dragged along
    const bottomInput = screen.getByLabelText("Min:");
    await fireEvent.change(bottomInput, { target: { value: 12 } });
    expect(screen.getByText("Bottom: 12")).toBeInTheDocument();
    expect(screen.getByText("Top: 13")).toBeInTheDocument();
  });
  it("keeps the bottom below the top", async () => {
    render(<Component />);
    expect(screen.getByText("Bottom: 5")).toBeInTheDocument();
    // Move the bottom above the old top and check that top got dragged along
    const topInput = screen.getByLabelText("Max:");
    await fireEvent.change(topInput, { target: { value: 2 } });
    expect(screen.getByText("Bottom: 1")).toBeInTheDocument();
    expect(screen.getByText("Top: 2")).toBeInTheDocument();
  });
  it("sets the center and width from top and bottom", async () => {
    render(<Component />);
    // Move the bottom above the old top and check that top got dragged along
    expect(screen.getByLabelText("Brightness:")).toHaveValue("7.5");
    expect(screen.getByLabelText("Contrast:")).toHaveValue("5");
  });
  it("sets the bottom and top when the center and width change", async () => {
    render(<Component />);
    const centerInput = screen.getByLabelText("Brightness:");
    await fireEvent.change(centerInput, { target: { value: 6 } });
    const widthInput = screen.getByLabelText("Contrast:");
    await fireEvent.change(widthInput, { target: { value: 4 } });
    // Check that state was updated
    expect(screen.getByText("Top: 8")).toBeInTheDocument();
    expect(screen.getByText("Bottom: 4")).toBeInTheDocument();
  });
});

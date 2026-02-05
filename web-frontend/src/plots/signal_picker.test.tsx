import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { SignalPicker } from "./signal_picker.tsx";

afterEach(() => {
  cleanup();
});

describe("the signal picker widget", () => {
  beforeEach(async () => {
    render(
      <SignalPicker
        signals={["It-net_current", "monochromator-gap"]}
        signal="It-net_current"
        localKey={"my_key"}
      />,
    );
  });
  it("shows signals", async () => {
    const options = screen.getAllByRole("option");
    expect(options.length).toEqual(2);
  });
});

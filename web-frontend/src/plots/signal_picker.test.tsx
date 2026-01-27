import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

import { SignalPicker } from "./signal_picker.tsx";

const stream = {
  structure_family: "container",
  ancestors: ["93b837d"],
  specs: [],
  configuration: {},
  hints: {
    It: { fields: ["It-net-current"] },
  },
  time: 0,
  uid: "123456",
  key: "primary",
  data_keys: {
    "It-net_current": {
      dtype: "number",
      shape: [],
      units: "A",
      source: "derived://It-net_current",
      dtype_numpy: "\u003Cf8",
      object_name: "It",
    },
    "monochromator-gap": {
      dtype: "number",
      shape: [],
      units: "um",
      limits: {
        control: {
          low: -24105,
          high: -24105,
        },
        display: {
          low: -24105,
          high: -24105,
        },
      },
      source: "ca://25idbUP:ACS:m4.RBV",
      precision: 3,
      dtype_numpy: "\u003Cf8",
      object_name: "monochromator",
    },
  },
};

afterEach(() => {
  cleanup();
});

describe("the signal picker widget", () => {
  beforeEach(async () => {
    const hints = ["It-net_current"];
    render(
      <SignalPicker
        dataKeys={stream.data_keys}
        localKey={"my_key"}
        hints={hints}
      />,
    );
  });
  it("shows hinted signals by default", async () => {
    const options = screen.getAllByRole("option");
    expect(options.length).toEqual(1);
  });
  it("can toggle hints off", async () => {
    const checkbox = screen.getByRole("checkbox");
    await fireEvent.click(checkbox);
    const options = screen.getAllByRole("option");
    // Two data keys plus "seq_num" and "time"
    expect(options.length).toEqual(4);
  });
});

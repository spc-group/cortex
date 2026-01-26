import * as React from "react";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { SignalPicker } from "./signal_picker.tsx";

const stream = {
  structure_family: "container",
  ancestors: ["93b837d"],
  specs: [],
  configuration: {},
  hints: {},
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
    const queryClient = new QueryClient();
    await React.act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SignalPicker dataKeys={stream.data_keys} localKey={"my_key"} />
        </QueryClientProvider>,
      );
    });
  });

  it("sets the values from datakeys", () => {
    const options = screen.getAllByRole("option");
    expect(options.length).toEqual(4);
  });
});

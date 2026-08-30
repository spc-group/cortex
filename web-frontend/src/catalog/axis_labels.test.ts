import { expect, describe, it } from "vitest";

import { axisLabels } from "./axis_labels";

describe("the axisLabels() utility", () => {
  it("gives a simple x-y label set", () => {
    const labels = axisLabels([
      {
        x: {
          name: "sim_motor_2",
          dataKey: { dtype: "number", shape: [] },
          path: "",
        },
        s: {
          name: "ge_13element",
          dataKey: { dtype: "number", shape: [101, 4, 4096] },
          path: "",
        },
        operation: null,
        inverted: false,
        logarithm: false,
        name: "ge_13element",
      },
    ]);
    expect(labels.x).toEqual("sim_motor_2");
    expect(labels.y).toEqual("ge_13element");
  });
  it("adds units to the x-axis", () => {
    const labels = axisLabels([
      {
        name: "ge_13element",
        x: {
          path: "",
          name: "sim_motor_2",
          dataKey: { units: "km", dtype: "int8", shape: [] },
        },
        s: {
          path: "",
          name: "ge_13element",
          dataKey: { dtype: "int8", shape: [21, 4, 1024] },
        },
        operation: null,
        inverted: false,
        logarithm: false,
      },
    ]);
    expect(labels.x).toEqual("sim_motor_2 /km");
    expect(labels.y).toEqual("ge_13element");
  });
  it("handles empty axis labels", () => {
    const labels = axisLabels([
      {
        name: "line",
        operation: null,
        inverted: false,
        logarithm: false,
      },
    ]);
    expect(labels.x).toEqual("");
    expect(labels.y).toEqual("");
  });
});

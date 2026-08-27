import { expect, describe, it } from "vitest";

import { axisLabels } from "./axis_labels";

describe("the axisLabels() utility", () => {
  it("gives a simple x-y label set", () => {
    const labels = axisLabels([
      {
        x: { name: "sim_motor_2" },
        s: { name: "ge_13element" },
        operation: "",
        inverted: false,
        logarithm: false,
      },
    ]);
    expect(labels.x).toEqual("sim_motor_2");
    expect(labels.y).toEqual("ge_13element");
  });
  it("adds units to the x-axis", () => {
    const labels = axisLabels([
      {
        x: {
          name: "sim_motor_2",
          dataKey: { units: "km", dtype: "int8", shape: [] },
        },
        s: { name: "ge_13element" },
        operation: "",
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
        operation: "",
        inverted: false,
        logarithm: false,
      },
    ]);
    expect(labels.x).toEqual("");
    expect(labels.y).toEqual("");
  });
});

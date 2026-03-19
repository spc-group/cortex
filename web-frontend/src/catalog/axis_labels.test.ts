import { expect, describe, it } from "vitest";

import { axisLabels } from "./axis_labels";

describe("the axisLabels() utility", () => {
  it("gives a simple x-y label set", () => {
    const labels = axisLabels({
      xSignal: ["sim_motor_2", null],
      vSignal: ["ge_13element", null],
      rSignal: ["", null],
      operation: "",
      inverted: false,
      logarithm: false,
    });
    expect(labels.x).toEqual("sim_motor_2");
    expect(labels.y).toEqual("ge_13element");
  });
  it("adds units to the x-axis", () => {
    const labels = axisLabels({
      xSignal: ["sim_motor_2", { units: "km", dtype: "int8", shape: [] }],
      vSignal: ["ge_13element", null],
      rSignal: ["", null],
      operation: "",
      inverted: false,
      logarithm: false,
    });
    expect(labels.x).toEqual("sim_motor_2 /km");
    expect(labels.y).toEqual("ge_13element");
  });
});

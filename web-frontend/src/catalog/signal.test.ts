import "@testing-library/jest-dom/vitest";
import { expect, describe, it } from "vitest";

import { signalSources } from "./signal";

describe("the signalSources() function", () => {
  it("returns all signals", () => {
    const sources = signalSources(
      {
        I0: { dtype: "int32", shape: [101], source: "mock+ca://255idc" },
      },
      null,
      {},
      {
        key: "primary",
        ancestors: ["run_id"],
        structure_family: "",
        specs: [],
        data_keys: {},
        configuration: {},
        hints: {},
        time: 0,
        uid: "",
      },
    );
    expect(sources).toEqual({
      I0: {
        path: "run_id/primary/internal/I0",
        name: "I0",
        dataKey: { dtype: "int32", shape: [101], source: "mock+ca://255idc" },
      },
    });
  });
  it("filters hints", () => {
    const signals = signalSources(
      {
        I0: { dtype: "int32", shape: [101], source: "mock+ca://255idc" },
        It: { dtype: "int32", shape: [101], source: "mock+ca://255idc" },
      },
      ["It"],
      {},
      {
        key: "primary",
        ancestors: ["run_id"],
        structure_family: "",
        specs: [],
        data_keys: {},
        configuration: {},
        hints: {},
        time: 0,
        uid: "",
      },
    );
    expect(Object.keys(signals)).toEqual(["It"]);
  });
  it("adds source for ROIs", () => {
    const dataKeys = {
      I0: { dtype: "int32", shape: [101], source: "mock+ca://255idc" },
    };
    const rois = {
      "run_id/primary/internal/I0": [
        {
          name: "Ni-Ka",
          isActive: true,
          uid: "b38dfe48-e756-45e7-8dd8-f1c5d891a488",
          x0: 0,
          x1: 10,
          y0: 0,
          y1: 25,
        },
      ],
    };
    const stream = {
      key: "primary",
      ancestors: ["run_id"],
      structure_family: "",
      specs: [],
      data_keys: {},
      configuration: {},
      hints: {},
      time: 0,
      uid: "",
    };
    const sources = signalSources(dataKeys, null, rois, stream);
    expect(Object.keys(sources)).toEqual(["I0", "I0 – Ni-Ka"]);
  });
  it("skips ROIs for unused signals", () => {
    const dataKeys = {
      I0: { dtype: "int32", shape: [101], source: "mock+ca://255idc" },
    };
    const rois = {
      It: [
        {
          name: "Ni-Ka",
          isActive: true,
          uid: "b38dfe48-e756-45e7-8dd8-f1c5d891a488",
          x0: 0,
          x1: 10,
          y0: 0,
          y1: 25,
        },
      ],
    };
    const stream = {
      key: "primary",
      ancestors: ["run_id"],
      structure_family: "",
      specs: [],
      data_keys: {},
      configuration: {},
      hints: {},
      time: 0,
      uid: "",
    };
    const sources = signalSources(dataKeys, null, rois, stream);
    expect(Object.keys(sources)).toEqual(["I0"]);
  });
});

import "@testing-library/jest-dom/vitest";
import { expect, describe, it } from "vitest";

import { signalSources } from "./signal";

describe("the signalSources() function", () => {
  it("returns signals", () => {
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
    expect(sources["I0"]).toEqual({
      path: "run_id/primary/internal/I0",
      timestampPath: "run_id/primary/internal/ts_I0",
      name: "I0",
      dataKey: { dtype: "int32", shape: [101], source: "mock+ca://255idc" },
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
    expect(Object.keys(sources)).toContain("I0 – Ni-Ka");
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
    expect(Object.keys(sources)).not.toContain("It – Ni-Ka");
  });
  it("includes `time` and `seq_num`", () => {
    const dataKeys = {
      I0: { dtype: "int32", shape: [101], source: "mock+ca://255idc" },
    };
    const rois = {};
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
    const sourceNames = Object.keys(sources);
    expect(sourceNames).toContain("seq_num");
    expect(sources.seq_num).toEqual({
      path: "run_id/primary/internal/seq_num",
      timestampPath: "run_id/primary/internal/time",
      dataKey: {
        dtype: "number",
        shape: [],
      },
      name: "seq_num",
    });
    expect(sources.time).toEqual({
      path: "run_id/primary/internal/time",
      timestampPath: "run_id/primary/internal/time",
      dataKey: {
        dtype: "number",
        shape: [],
      },
      name: "time",
    });
  });
  it("includes timestamp path for internal signls", () => {
    const dataKeys = {
      I0: { dtype: "int32", shape: [101], source: "mock+ca://255idc" },
    };
    const rois = {};
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
    expect(sources.I0.timestampPath).toEqual("run_id/primary/internal/ts_I0");
  });
});

import axios from "axios";
import type { AxiosInstance } from "axios";
import { describe, it, expect, beforeEach } from "vitest";
import { tableFromArrays } from "apache-arrow";

import { apiInfoJson, mockUrl } from "../mocks/tiled";

import {
  getRuns,
  getApiInfo,
  prepareQueryParams,
  getDataKeys,
  getTableData,
  getStreams,
} from "./tiled_api";

let client: AxiosInstance;
beforeEach(() => {
  client = axios.create({ baseURL: mockUrl });
});

describe("getRuns() function", () => {
  it("returns the right number of runs", async () => {
    const filters = {
      "start.uid": "58839482",
      "stop.exit_status": "success",
    };
    const { runs } = await getRuns(
      {
        pageOffset: 10,
        pageLimit: 20,
        // client: client,
        filters: filters,
        searchText: "super awesome experiment",
        standardsOnly: true,
      },
      { client },
    );
    expect(runs.length).toEqual(1);
    expect(runs[0].metadata.start.uid).toEqual("58839482");
    expect(runs[0].key).toEqual("58839482");
  });
});

describe("prepareQueryParams() function", () => {
  it("includes the correct fields", () => {
    const params = prepareQueryParams({
      pageOffset: 10,
      pageLimit: 20,
      // client: client,
      sortField: "-start.time",
    });
    expect(params.has("fields")).toBeTruthy();
    expect(params.getAll("fields")).toEqual(["metadata", "specs", "count"]);
  });
  it("applies a sort field", async () => {
    const params = await prepareQueryParams({
      pageOffset: 10,
      pageLimit: 20,
      // client: client,
      sortField: "-start.time",
    });
    expect(params.get("sort")).toEqual("-start.time");
  });
});

describe("getApiInfo() function", () => {
  // HTTP responses defined in './mocks/tiled.ts'
  it("calls the API", async () => {
    const apiInfo = await getApiInfo({ client });
    expect(apiInfo).toEqual(apiInfoJson);
  });
});

describe("getDataKeys() function", () => {
  // HTTP responses defined in './mocks/tiled.ts'
  it("gets data keys for a given run", async () => {
    const uid = "b68c7712-cb05-47f4-8e25-11cb05cc2cd5";
    const stream = "primary";
    const dataKeys = await getDataKeys(uid, stream, { client });
    expect(dataKeys["It-net_current"].source).toEqual(
      "derived://It-net_current",
    );
  });
});

describe("getTableData() function", () => {
  it("loads full table", async () => {
    const data = await getTableData(
      "b68c7712-cb05-47f4-8e25-11cb05cc2cd5/primary",
      undefined,
      undefined,
      { client },
    );
    const expectedTable = tableFromArrays({
      seq_num: [1, 2],
      time: [1747085782.057788, 1747085783.246987],
      sim_motor_2: [-100, 100],
      ts_sim_motor_2: [1747085782.032349, 1747085783.233922],
    });
    expect(data.toArray()).toEqual(expectedTable.toArray());
  });
});

describe("getStreams()", () => {
  it("gets top level streams data", async () => {
    const streams = await getStreams("new_run", { client });
    expect(Object.keys(streams)).toEqual(["primary"]);
    expect(streams["primary"].key).toEqual("primary");
    expect(streams["primary"].key).toEqual("primary");
  });
  it("includes stream metadata", async () => {
    const streams = await getStreams("new_run", { client });
    const stream = streams.primary;
    expect(stream.key).toEqual("primary");
    expect(Object.keys(stream.data_keys)).toContain("sim_motor_2");
    expect(Object.keys(stream.hints)).toContain("sim_motor_2");
    expect(stream.time).toEqual(1767998299.2170787);
    expect(stream.uid).toEqual("3bea507b-c00f-4a84-82ba-be08dc0eb9cf");
    expect(Object.keys(stream.configuration)).toContain("sim_motor_2");
    expect(stream.ancestors).toEqual([
      "6bc6d326-d288-42c8-98d4-0f20f715fca1",
      "streams",
    ]);
    expect(stream.structure_family).toEqual("container");
    expect(stream.specs.length).toEqual(2);
  });
  it("navigates the legacy 'streams' namespace", async () => {
    const streams = await getStreams("legacy_run", { client });
    expect(Object.keys(streams)).toEqual(["primary"]);
    expect(streams["primary"].key).toEqual("primary");
    expect(streams["primary"].ancestors).toEqual([
      "6bc6d326-d288-42c8-98d4-0f20f715fca1",
      "streams",
    ]);
  });
});

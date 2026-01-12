import axios from "axios";
import {
  getRuns,
  getApiInfo,
  prepareQueryParams,
  getDataKeys,
  getTableData,
  getStreams,
} from "./tiled_api";
import { describe, it, expect, beforeEach } from "vitest";
import { apiInfoJson, mockUrl } from "../mocks/tiled";
let client;
beforeEach(() => {
  client = axios.create({baseURL: mockUrl});
});

describe("getRuns() function", () => {
  it("returns the right number of runs", async () => {
    const filters = {
      "start.uid": "58839482",
      "stop.exit_status": "success",
    };
    const runs = await getRuns({
      pageOffset: 10,
      pageLimit: 20,
      // client: client,
      filters: filters,
      searchText: "super awesome experiment",
      standardsOnly: true,
    }, {client});
    expect(runs.runs.length).toEqual(1);
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
    const apiInfo = await getApiInfo({client});
    expect(apiInfo).toEqual(apiInfoJson);
  });
});

describe("getDataKeys() function", () => {
  // HTTP responses defined in './mocks/tiled.ts'
  it("gets data keys for a given run", async () => {
    const uid = "b68c7712-cb05-47f4-8e25-11cb05cc2cd5";
    const stream = "primary";
    const dataKeys = await getDataKeys(uid, stream, {client});
    expect(dataKeys["It-net_current"].source).toEqual(
      "derived://It-net_current",
    );
  });
});

describe("getTableData() function", () => {
  it("loads full table", async () => {
    const data = await getTableData(
      "primary",
      "b68c7712-cb05-47f4-8e25-11cb05cc2cd5",
      null,
      null,
      {client},
    );
    expect(data).toEqual({
      seq_num: [1, 2],
      time: [1747085782.057788, 1747085783.246987],
      sim_motor_2: [-100, 100],
      ts_sim_motor_2: [1747085782.032349, 1747085783.233922],
    });
  });
  it("selects columns", async () => {
    const columns = ["sim_motor_2", "seq_num"];
    const data = await getTableData(
      "primary",
      "b68c7712-cb05-47f4-8e25-11cb05cc2cd5",
      columns,
      null,
      {client},
    );
    expect(data).toEqual({
      seq_num: [1, 2],
      sim_motor_2: [-100, 100],
    });
  });
});

describe("getStreams()", () => {
  it("gets top level streams name", async () => {
    const streams = await getStreams("new_run", {client});
    expect(streams).toEqual(['primary']);
  });
  it("navigates the legacy 'streams' namespace", async () => {
    const streams = await getStreams("legacy_run", {client});
    expect(streams).toEqual(['streams/primary']);
  });
});

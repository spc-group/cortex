import { getRuns, getApiInfo, prepareQueryParams } from "./tiled_api";
import { describe, it, expect } from "vitest";
import { apiInfoJson } from "./mocks/tiled";

describe("getRuns() function", () => {
  it("returns the right number of runs", async () => {
    const filters = new Map([
      ["start.uid", "58839482"],
      ["stop.exit_status", "success"],
    ]);
    const runs = await getRuns({
      pageOffset: 10,
      pageLimit: 20,
      // client: client,
      filters: filters,
      searchText: "super awesome experiment",
      standardsOnly: true,
    });
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
    const apiInfo = await getApiInfo();
    expect(apiInfo).toEqual(apiInfoJson);
  });
});

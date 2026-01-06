import { getRuns, getApiInfo, prepareQueryParams, getDataKeys } from "./tiled_api";
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


describe("getDataKeys() function", () => {
    // HTTP responses defined in './mocks/tiled.ts'
    it("gets data keys for a given run", async () => {
        const uid = "b68c7712-cb05-47f4-8e25-11cb05cc2cd5";
        const stream = "primary";
        const dataKeys: {[index: string]: any} = await getDataKeys(uid, stream);
        // "It-net_current": {
        //     "dtype": "number",
        //     "shape": [],
        //     "units": "A",
        //     "source": "derived://It-net_current",
        //     "dtype_numpy": "\u003Cf8",
        //     "object_name": "It"
        // },
        expect(dataKeys["It-net_current"].source).toEqual("derived://It-net_current");
    });
});

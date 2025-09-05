import { getRuns, getApiInfo, Container, parseNode } from "./tiled_api";
import { vi, describe, it, expect, beforeEach } from "vitest";

const client = {
    get: vi.fn(async () => {
	return {
	    data: {
		data: [],
		meta: {count: 0}
	    }
	}
    }),
};


describe("getRuns() function", () => {
    beforeEach(() => {
	client.get.mockClear();
    });
    it("applies filters", async () => {
	const filters = new Map([
	    ["start.uid", "58839482"],
	    ["stop.exit_status", "success"],
	]);
	await getRuns({
	    pageOffset: 10,
	    pageLimit: 20 ,
	    client: client,
	    filters: filters,
	    searchText: "super awesome experiment",
	    catalog: "scans",
	    standardsOnly: true,
	});
	expect(client.get.mock.calls).toHaveLength(1);
	const url = client.get.mock.calls[0][0];
	expect(url).toEqual("search/scans");
	const params = client.get.mock.calls[0][1].params;
	const containsKeys = params.getAll("filter[contains][condition][key]");
	expect(containsKeys).toEqual(["start.uid", "stop.exit_status"]);
	const equalKeys = params.getAll("filter[eq][condition][key]");
	expect(equalKeys).toEqual(["start.is_standard"]);
	expect(params.get("filter[fulltext][condition][text]")).toEqual("super awesome experiment");
    });
    it("applies a sort field", async () => {
	await getRuns({ pageOffset: 10, pageLimit: 20 , client: client, sortField: "-start.time" });
	expect(client.get.mock.calls).toHaveLength(1);
	const params = client.get.mock.calls[0][1].params;
	expect(params.get("sort")).toEqual("-start.time");
    });
});


describe("getApiInfo() function", () => {
    beforeEach(() => {
	client.get.mockClear();
    });
    it("calls the API", async () => {
	const response = await getApiInfo({client});
	expect(client.get.mock.calls).toHaveLength(1);
    });
});

import "@testing-library/jest-dom/vitest";
import axios from "axios";
import type { AxiosInstance } from "axios";
import { vi, describe, it, afterEach, beforeEach, expect } from "vitest";
import type { Mock } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";

import { mockUrl, tiledServer } from "../mocks";
import { prepareQueryParams, getSearch, useSearch } from "./search";
import { useTiledWebSocket } from "./streaming";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
  tiledServer.resetHandlers();
});

describe("getSearch() API call", () => {
  let client: AxiosInstance;
  beforeEach(() => {
    client = axios.create({ baseURL: mockUrl });
  });

  it("returns the right number of runs", async () => {
    const filters = [
      { type: "eq", key: "start.uid", value: "58839482" },
      { type: "eq", key: "stop.exit_status", value: "success" },
    ];
    const { data } = await getSearch(
      {
        pageOffset: 10,
        pageLimit: 20,
        sortField: null,
        filters: filters,
      },
      { client },
    );
    expect(data.length).toEqual(1);
    expect(data[0].attributes.metadata.start.uid).toEqual("58839482");
    expect(data[0].id).toEqual("58839482");
  });
});

describe("prepareQueryParams() function", () => {
  it("includes the correct fields", () => {
    const params = prepareQueryParams({
      pageOffset: 10,
      pageLimit: 20,
      sortField: null,
      filters: [],
    });
    expect(params.has("fields")).toBeTruthy();
    expect(params.getAll("fields")).toEqual(["metadata", "specs", "count"]);
  });
  it("applies a sort field", async () => {
    const params = prepareQueryParams({
      pageOffset: 10,
      pageLimit: 20,
      sortField: "-start.time",
      filters: [],
    });
    expect(params.get("sort")).toEqual("-start.time");
  });
  it("applies filters", async () => {
    const filters = [
      {
        type: "fulltext",
        value: "spoof",
      },
      {
        type: "regex",
        key: "start.message",
        value: "hello\\s+world",
        case_sensitive: true,
      },
      {
        type: "eq",
        key: "start.scan_name",
        value: "spammy eggs",
      },
      {
        type: "noteq",
        key: "start.operator",
        value: "River",
      },
      {
        type: "comparison",
        key: "start.time",
        operator: "lte",
        value: 0,
      },
      {
        type: "contains",
        key: "start.humans",
        value: "squishy one",
      },
      {
        type: "in",
        key: "start.beamline",
        value: ["25-ID-C", "25-ID-D"],
      },
      {
        type: "notin",
        key: "start.beamline",
        value: ["9-BM-A"],
      },
      {
        type: "like",
        key: "start.beamline",
        value: "25-ID%",
      },
    ];
    const params = prepareQueryParams({
      pageOffset: 0,
      pageLimit: 100,
      filters: filters,
      sortField: "",
    });
    // use `getAll` to check for missing `break;` statements
    // Full text
    expect(params.getAll("filter[fulltext][condition][text]")).toEqual([
      '"spoof"',
    ]);
    // Regex
    expect(params.getAll("filter[regex][condition][key]")).toEqual([
      "start.message",
    ]);
    expect(params.getAll("filter[regex][condition][pattern]")).toEqual([
      '"hello\\\\s+world"',
    ]);
    expect(params.getAll("filter[regex][condition][case_sensitive]")).toEqual([
      "true",
    ]);
    // Equals
    expect(params.getAll("filter[eq][condition][key]")).toEqual([
      "start.scan_name",
    ]);
    expect(params.getAll("filter[eq][condition][value]")).toEqual([
      '"spammy eggs"',
    ]);
    // Not equal
    expect(params.getAll("filter[noteq][condition][key]")).toEqual([
      "start.operator",
    ]);
    expect(params.getAll("filter[noteq][condition][value]")).toEqual([
      '"River"',
    ]);
    // Comparison
    expect(params.getAll("filter[comparison][condition][operator]")).toEqual([
      "lte",
    ]);
    expect(params.getAll("filter[comparison][condition][key]")).toEqual([
      "start.time",
    ]);
    expect(params.getAll("filter[comparison][condition][value]")).toEqual([
      "0",
    ]);
    // Contains
    expect(params.getAll("filter[contains][condition][key]")).toEqual([
      "start.humans",
    ]);
    expect(params.getAll("filter[contains][condition][value]")).toEqual([
      '"squishy one"',
    ]);
    // In
    expect(params.getAll("filter[in][condition][key]")).toEqual([
      "start.beamline",
    ]);
    expect(params.getAll("filter[in][condition][value]")).toEqual([
      '["25-ID-C","25-ID-D"]',
    ]);
    // Not In
    expect(params.getAll("filter[notin][condition][key]")).toEqual([
      "start.beamline",
    ]);
    expect(params.getAll("filter[notin][condition][value]")).toEqual([
      '["9-BM-A"]',
    ]);
    // Like
    expect(params.getAll("filter[like][condition][key]")).toEqual([
      "start.beamline",
    ]);
    expect(params.getAll("filter[like][condition][pattern]")).toEqual([
      '"25-ID%"',
    ]);
    // Template
    // expect(params.getAll('')).toEqual([]);
  });
});

// Mocks for the network I/O tools used for this hook
const webSocketSequence = 42;
vi.mock("./streaming", async () => {
  return {
    useTiledWebSocket: vi.fn(() => {
      return {
        payload: {
          type: "container-child-created",
          sequence: webSocketSequence,
          key: "23456",
        },
        readyState: 1,
      };
    }),
  };
});

vi.mock("@tanstack/react-query", async () => {
  return {
    // ...(await importOriginal()),
    useQuery: vi.fn(() => ({
      isLoading: false,
      data: {
        data: [
          {
            id: "12345",
            attributes: { metadata: { start: { scan_name: "hello" } } },
          },
        ],
        count: 1,
      },
    })),
  };
});

describe("useSearch() hook", () => {
  const MockComponent = () => {
    const { data, count } = useSearch("catalog", {
      sortField: "",
      pageLimit: 100,
      pageOffset: 0,
      filters: [],
    });
    const datum: { id?: string } = data == null ? {} : data[0];
    return (
      <>
        <div>ID: {datum?.id}</div>
        <div>Count: {count}</div>
      </>
    );
  };
  it("returns a list of results", () => {
    render(<MockComponent />);
    expect(screen.getByText("ID: 12345")).toBeInTheDocument();
  });
  it("returns the result count", () => {
    render(<MockComponent />);
    expect(screen.getByText("Count: 1")).toBeInTheDocument();
  });
  it("checks for updates from parent", () => {
    render(<MockComponent />);
    const lastCall = (useTiledWebSocket as Mock).mock.lastCall as string[];
    expect(lastCall[0]).toEqual("catalog");
  });
  it("uses the websocket sequence", () => {
    render(<MockComponent />);
    const queryKey = (useQuery as Mock).mock.lastCall?.[0].queryKey;
    expect(queryKey[1]).toEqual(webSocketSequence);
  });
});

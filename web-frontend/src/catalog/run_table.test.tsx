// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import * as React from "react";
import "@testing-library/jest-dom/vitest";
import { BrowserRouter } from "react-router";
import {
  expect,
  describe,
  it,
  beforeEach,
  afterEach,
  vi,
  cleanup,
} from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import RunTable, { Row } from "./run_table";
import { allColumns } from "./columns.ts";

const queryClient = new QueryClient();

const testColumns = allColumns;

afterEach(() => {
  cleanup();
});

describe("run table", () => {
  let user, setSortField;
  beforeEach(() => {
    user = userEvent.setup();
    setSortField = vi.fn(() => {});
  });
  it("creates rows for each run", () => {
    const runs = [
      {
        uid: 0,
        metadata: { start: { uid: "4e4a2ec3-5d33-4f47-b6a3-15cfdf1e41aa" } },
      },
      {
        uid: 1,
        metadata: { start: { uid: "391c9a55-8dfa-4faa-be49-e60140596b7c" } },
      },
    ];
    render(
      <BrowserRouter>
        <RunTable runs={runs} columns={testColumns} />
      </BrowserRouter>,
    );
    expect(
      screen.getByText("4e4a2ec3-5d33-4f47-b6a3-15cfdf1e41aa"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("391c9a55-8dfa-4faa-be49-e60140596b7c"),
    ).toBeInTheDocument();
  });
  it("can (de)select a run", async () => {
    const selectRun = vi.fn(() => {});
    // Prepare the UI
    const runs = [
      {
        uid: "4e4a2ec3-5d33-4f47-b6a3-15cfdf1e41aa",
        metadata: { start: { uid: "4e4a2ec3-5d33-4f47-b6a3-15cfdf1e41aa" } },
      },
    ];
    render(
      <BrowserRouter>
        <RunTable runs={runs} selectRun={selectRun} />
      </BrowserRouter>,
    );
    const checkbox = screen.getByRole("checkbox");
    // Check the box
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    // Un-check the box
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    // Was the selection updated properly?
    expect(selectRun.mock.calls).toHaveLength(2);
    expect(selectRun.mock.calls[0][0]).toEqual(
      "4e4a2ec3-5d33-4f47-b6a3-15cfdf1e41aa",
    );
    expect(selectRun.mock.calls[0][1]).toBe(true);
    expect(selectRun.mock.calls[1][0]).toEqual(
      "4e4a2ec3-5d33-4f47-b6a3-15cfdf1e41aa",
    );
    expect(selectRun.mock.calls[1][1]).toBe(false);
  });
  it("sorts ascending by column", async () => {
    render(
      <RunTable
        runs={[]}
        setSortField={setSortField}
        sortField={null}
        columns={testColumns}
      />,
    );
    const heading = screen.getByText("UID");
    await user.click(heading);
    // Check that we updated the sort field properly
    expect(setSortField.mock.calls).toHaveLength(1);
    expect(setSortField.mock.calls[0][0]).toEqual("start.uid");
  });
  it("sorts descending by column", async () => {
    render(
      <RunTable
        runs={[]}
        setSortField={setSortField}
        sortField={"start.uid"}
        columns={testColumns}
      />,
    );
    const heading = screen.getByText("UID");
    await user.click(heading);
    // Check that we updated the sort field properly
    expect(setSortField.mock.calls).toHaveLength(1);
    expect(setSortField.mock.calls[0][0]).toEqual("-start.uid");
  });
  it("turns off sorting", async () => {
    render(
      <RunTable
        runs={[]}
        setSortField={setSortField}
        sortField={"-start.uid"}
        columns={testColumns}
      />,
    );
    const heading = screen.getByText("UID");
    await user.click(heading);
    // Check that we updated the sort field properly
    expect(setSortField.mock.calls).toHaveLength(1);
    expect(setSortField.mock.calls[0][0]).toEqual("");
  });
});

describe("run table row", () => {
  beforeEach(() => {
    vi.mock("@tanstack/react-query", async (importOriginal) => {
      return {
        ...(await importOriginal()),
        useQuery: () => ({
          isLoading: false,
          error: null,
          data: {
            formats: {
              container: ["application/x-hdf5", "application/json"],
              XASRun: ["text/x-xdi"],
            },
            aliases: {
              container: {
                "application/x-hdf5": ["h5", "hdf5"],
                "application/json": ["json"],
              },
              XASRun: {
                "text/x-xdi": ["xdi"],
              },
            },
          },
        }),
      };
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("shows export buttons", () => {
    const run = {
      specs: [{ name: "XASRun", version: "1.0" }],
      structure_family: "container",
      metadata: {
        start: {
          uid: "883847",
          sample_name: "CrO3",
          scan_name: "NiK",
          plan_name: "xafs_scan",
          time: new Date(),
          proposal: "",
          esaf: "",
        },
        stop: {
          exit_status: "",
        },
      },
    };
    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <table>
            <tbody>
              <Row
                run={run}
                apiUri={"https://remotehost/api/v1/"}
                columns={testColumns}
              />
            </tbody>
          </table>
        </QueryClientProvider>
      </BrowserRouter>,
    );
    const link = screen.getByText("xdi");
    expect(link).toBeInTheDocument();
    const href = Object.values(link)[0].memoizedProps.href;
    expect(href).toContain("https://remotehost/api/v1/");
    expect(href).toContain(run["start.uid"]);
    expect(href).toContain("format=text/x-xdi");
    const filename = Object.values(link)[0].memoizedProps.download;
    expect(filename).toEqual("883847-CrO3-NiK-xafs_scan.xdi");
  });
  it("shows the data-run icon", () => {
    const run = {
      metadata: {
        start: {
          uid: "",
          plan_name: "",
          scan_name: "",
          sample_name: "",
          time: new Date(),
          proposal: "",
          esaf: "",
        },
        stop: {
          exit_status: "",
        },
      },
      structure_family: "",
      specs: [
        {
          name: "XASRun",
          version: "1.0",
        },
      ],
    };
    render(
      <BrowserRouter>
        <table>
          <tbody>
            <Row
              run={run}
              apiUri={"https://remotehost/api/v1/"}
              columns={testColumns}
            />
          </tbody>
        </table>
      </BrowserRouter>,
    );
    expect(screen.getByTitle("Data run icon")).toBeInTheDocument();
  });
  it("has the correct columns", () => {
    const run = {
      metadata: {
        start: {
          uid: "4e4a2ec3-5d33-4f47-b6a3-15cfdf1e41aa",
          plan_name: "rel_scan",
          scan_name: "copper tastic",
          sample_name: "SrN03",

          time: 0,
          proposal_id: "2",
          esaf_id: "13",
        },
        stop: {
          exit_status: "success",
        },
        specs: [],
        structure_family: "",
      },
    };
    const columns = testColumns;
    render(
      <BrowserRouter>
        <table>
          <tbody>
            <Row run={run} columns={columns} />
          </tbody>
        </table>
      </BrowserRouter>,
    );
    expect(
      screen.getByText("4e4a2ec3-5d33-4f47-b6a3-15cfdf1e41aa"),
    ).toBeInTheDocument();
    expect(screen.getByText("rel_scan")).toBeInTheDocument();
    expect(screen.getByText("SrN03")).toBeInTheDocument();
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("1970-01-01 00:00")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("13")).toBeInTheDocument();
  });
});

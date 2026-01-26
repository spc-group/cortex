// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import * as React from "react";
import { expect, vi, describe, beforeEach, afterEach, it } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { useSearch } from "../tiled";

import { RunList, Paginator } from "./run_list.tsx";

vi.mock("../tiled/search", () => {
  return {
    useSearch: vi.fn(() => {
      return { data: [], isLoading: false, error: null, count: 0 };
    }),
  };
});

afterEach(() => {
  cleanup();
});

describe("paginator", () => {
  let user, setPageLimit, setPageOffset;
  beforeEach(() => {
    user = userEvent.setup();
    setPageLimit = vi.fn(() => {});
    setPageOffset = vi.fn(() => {});
  });
  it("increments the page", async () => {
    // Render the component
    render(
      <Paginator
        runCount={50}
        pageOffset={10}
        setPageOffset={setPageOffset}
        setPageLimit={setPageLimit}
      />,
    );
    // Change the page
    expect(screen.getByText("10 - 20")).toBeInTheDocument();
    const button = screen.getByText("»");
    await user.click(button);
    expect(setPageOffset.mock.calls).toHaveLength(1);
    expect(setPageOffset.mock.calls[0][0]).toEqual(20);
  });
  it("decrements the page", async () => {
    // Render the component
    render(
      <Paginator
        runCount={50}
        pageOffset={20}
        setPageOffset={setPageOffset}
        setPageLimit={setPageLimit}
      />,
    );
    // Change the page
    expect(screen.getByText("20 - 30")).toBeInTheDocument();
    const button = screen.getByText("«");
    await user.click(button);
    expect(setPageOffset.mock.calls).toHaveLength(1);
    expect(setPageOffset.mock.calls[0][0]).toEqual(10);
  });
  it("stops at zero", async () => {
    render(
      <Paginator
        runCount={50}
        pageOffset={5}
        setPageOffset={setPageOffset}
        setPageLimit={setPageLimit}
      />,
    );
    // Change the page
    const button = screen.getByText("«");
    await user.click(button);
    expect(setPageOffset.mock.calls).toHaveLength(1);
    expect(setPageOffset.mock.calls[0][0]).toEqual(0);
  });
  it("stops at the max count", async () => {
    render(
      <Paginator
        runCount={40}
        pageOffset={25}
        pageLimit={10}
        setPageOffset={setPageOffset}
        setPageLimit={setPageLimit}
      />,
    );
    // Change the page
    const button = screen.getByText("»");
    await fireEvent.click(button);
    expect(setPageOffset.mock.calls).toHaveLength(1);
    expect(setPageOffset.mock.calls[0][0]).toEqual(30);
  });
  it("disables buttons at the limits", () => {
    // This row count should just fit inside the 10 runs per page
    render(
      <Paginator
        runCount={10}
        pageOffset={0}
        pageLimit={10}
        setPageOffset={setPageOffset}
        setPageLimit={setPageLimit}
      />,
    );
    let button = screen.getByText("«");
    expect(button).toBeDisabled();
    button = screen.getByText("»");
    expect(button).toBeDisabled();
  });
  it("enables buttons just insde the limits", () => {
    // This row count should have one leftover run that needs to be on each of adjacent pages
    render(
      <Paginator
        runCount={12}
        pageOffset={1}
        setPageOffset={setPageOffset}
        setPageLimit={setPageLimit}
      />,
    );
    let button = screen.getByText("«");
    expect(button).toBeEnabled();
    button = screen.getByText("»");
    expect(button).toBeEnabled();
  });
});

describe("run list", () => {
  let user;
  let component;
  beforeEach(async () => {
    const queryClient = new QueryClient();
    await React.act(() => {
      component = render(
        <MemoryRouter>
          <QueryClientProvider client={queryClient}>
            <RunList debounce={0} />
          </QueryClientProvider>
          ,
        </MemoryRouter>,
      );
    });
    user = userEvent.setup();
  });
  it("selects a run", () => {});
  it("applies column filters", async () => {
    // Find a filter text box
    const textbox = screen.getByTitle("Filter by UID");
    useSearch.mockClear();
    await user.type(textbox, "8675309");
    expect(useSearch.mock.calls.length).toBeGreaterThan(0);
    const options = useSearch.mock.lastCall[1];
    expect(options.filters[0].key).toEqual("start.uid");
    expect(options.filters[0].value).toEqual("8675309");
  });
  it("applies full text search", async () => {
    useSearch.mockClear();
    const textbox = screen.getByPlaceholderText("Search (full words)…");
    expect(textbox).toBeInTheDocument();
    await user.type(textbox, "Thorium");
    component.rerender();
    expect(useSearch.mock.calls.length).toBeGreaterThan(0);
    const filters = useSearch.mock.lastCall[1].filters;
    expect(filters.length).toEqual(1);
    expect(filters[0].type).toEqual("fulltext");
    expect(filters[0].value).toEqual("Thorium");
  });
  it("filters standards only", async () => {
    const checkbox = screen.getByTitle("Standards checkbox");
    useSearch.mockClear();
    await user.click(checkbox);
    expect(useSearch.mock.calls.length).toBeGreaterThan(0);
    const filters1 = useSearch.mock.lastCall[1].filters;
    expect(filters1.length).toEqual(1);
    expect(filters1[0].key).toEqual("start.is_standard");
    expect(filters1[0].value).toEqual("true");
    await user.click(checkbox);
    const filters2 = useSearch.mock.lastCall[1].filters;
    expect(filters2.length).toEqual(0);
  });
  it("filters by before date", async () => {
    const beforeInput = screen.getByTitle(
      "Only include runs started before a given time.",
    );
    useSearch.mockClear();
    fireEvent.change(beforeInput, { target: { value: "2025-01-01T08:00" } });
    expect(useSearch.mock.lastCall[1].filters).toHaveLength(1);
    // In chicago time: 1735740000000
    // In          UTC: 1735718400000
    expect(useSearch.mock.lastCall[1].filters[0].type).toEqual("comparison");
    expect(useSearch.mock.lastCall[1].filters[0].key).toEqual("start.time");
    expect(useSearch.mock.lastCall[1].filters[0].operator).toEqual("lt");
    expect(useSearch.mock.lastCall[1].filters[0].value).toEqual(1735718400);
  });
  it("filters by after date", async () => {
    const afterInput = screen.getByTitle(
      "Only include runs started on or after a given time.",
    );
    useSearch.mockClear();
    fireEvent.change(afterInput, { target: { value: "2025-01-01T08:00" } });
    expect(useSearch.mock.lastCall[1].filters.length).not.toEqual(0);
    // In chicago time: 1735740000
    // In          UTC: 1735718400
    expect(useSearch.mock.lastCall[1].filters[0].type).toEqual("comparison");
    expect(useSearch.mock.lastCall[1].filters[0].key).toEqual("start.time");
    expect(useSearch.mock.lastCall[1].filters[0].operator).toEqual("ge");
    expect(useSearch.mock.lastCall[1].filters[0].value).toEqual(1735718400);
  });
});

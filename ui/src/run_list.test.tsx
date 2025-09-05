import * as React from "react";
import { expect, vi, describe, beforeEach, afterEach, it } from "vitest";
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { getRuns } from "./tiled_api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import RunList, { Paginator } from "./run_list";


vi.mock("./tiled_api", () => ({
    "getRuns": vi.fn(() => Promise.resolve([])),
}));


afterEach(() => {
    cleanup();
});


describe("paginator", () => {
    let user, setPageLimit, setPageOffset;
    beforeEach(() => {
        user = userEvent.setup();
        setPageLimit = vi.fn((newLimit) => {});
        setPageOffset = vi.fn((newOffset) => {});
    });
    it("increments the page", async () => {
	// Render the component
	render(<Paginator runCount={50} pageOffset={10} setPageOffset={setPageOffset} setPageLimit={setPageLimit} />);
        // Change the page
        expect(screen.getByText("10 - 20")).toBeInTheDocument();
        const button = screen.getByText("»");
        await user.click(button);
        expect(setPageOffset.mock.calls).toHaveLength(1);
        expect(setPageOffset.mock.calls[0][0](10)).toEqual(20);
    });
    it("decrements the page", async () => {
	// Render the component
	render(<Paginator runCount={50} pageOffset={20} setPageOffset={setPageOffset} setPageLimit={setPageLimit} />);
        // Change the page
        expect(screen.getByText("20 - 30")).toBeInTheDocument();
        const button = screen.getByText("«");
        await user.click(button);
        expect(setPageOffset.mock.calls).toHaveLength(1);
        expect(setPageOffset.mock.calls[0][0](20)).toEqual(10);
    });
    it("stops at zero", async () => {
        render(<Paginator runCount={50} pageOffset={15} setPageOffset={setPageOffset} setPageLimit={setPageLimit} />);
        // Change the page
        let button = screen.getByText("«");
        await user.click(button);
        expect(setPageOffset.mock.calls).toHaveLength(1);
        expect(setPageOffset.mock.calls[0][0](5)).toEqual(0);
    });
    it("stops at the max count", async () => {
        render(<Paginator runCount={40} pageOffset={25} pageLimit={10} setPageOffset={setPageOffset} setPageLimit={setPageLimit} />);
        // Change the page
        const button = screen.getByText("»");
        await user.click(button);
        expect(setPageOffset.mock.calls).toHaveLength(1);
        expect(setPageOffset.mock.calls[0][0](25)).toEqual(30);
    });
    it("disables buttons at the limits", () => {
        // This row count should just fit inside the 10 runs per page
        render(<Paginator runCount={10} pageOffset={0} pageLimit={10} setPageOffset={setPageOffset} setPageLimit={setPageLimit} />);
        let button = screen.getByText("«");
        expect(button).toBeDisabled();
        button = screen.getByText("»");
        expect(button).toBeDisabled();
    });
    it("enables buttons just insde the limits", () => {
        // This row count should have one leftover run that needs to be on each of adjacent pages
        render(<Paginator runCount={12} pageOffset={1} setPageOffset={setPageOffset} setPageLimit={setPageLimit} />);
        let button = screen.getByText("«");
        expect(button).toBeEnabled();
        button = screen.getByText("»");
        expect(button).toBeEnabled();
    });

});


describe("run list", () => {
    let user;
    beforeEach(async () => {
	getRuns.mockClear();
	const queryClient = new QueryClient();
	await React.act(async () => {
	    render(
                <QueryClientProvider client={queryClient}>
                  <RunList />
                </QueryClientProvider>
            );
	});
	user = userEvent.setup();

    });
    it("selects a run", () => {
    });
    it("selects a catalog", () => {
        // For now just use a default
        expect(getRuns.mock.calls[0][0]["catalog"]).toEqual("scans");
    });
    it("applies column filters", async () => {
        // Find a filter text box
        const textbox = screen.getByPlaceholderText("Filter UID");
	getRuns.mockClear();
        await user.type(textbox, "8675309");
        await new Promise(r => setTimeout(r, 520));  // Wait for debounce
	expect(getRuns.mock.calls).toHaveLength(1);
	expect(getRuns.mock.calls[0][0]["filters"]).toEqual(new Map([["start.uid", "8675309"]]));
    });
    it("applies generic filters", async () => {
        const textbox = screen.getByPlaceholderText("Search (full words)…");
        getRuns.mockClear();
        await user.type(textbox, "Thorium");
        await new Promise(r => setTimeout(r, 520));  // Wait for debounce
        expect(getRuns.mock.calls).toHaveLength(1);
        expect(getRuns.mock.calls[0][0]["searchText"]).toEqual("Thorium");

    });
    it("filters standards only", async () => {
        const checkbox = screen.getByTitle("Standards checkbox");
        getRuns.mockClear();
        await user.click(checkbox);
        expect(getRuns.mock.calls).toHaveLength(1);
        expect(getRuns.mock.calls[0][0]["standardsOnly"]).toEqual(true);
        await user.click(checkbox);
        expect(getRuns.mock.calls).toHaveLength(2);
        expect(getRuns.mock.calls[1][0]["standardsOnly"]).toEqual(false);

    });
});


import * as React from "react";
import { vi, expect, describe, beforeEach, afterEach, it } from "vitest";
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { useParams, BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { getMetadata } from "./tiled_api";
import Run, { loadRunMetadata} from "./run";



// Mock URL parameters
vi.mock(import("react-router"),  async (importOriginal) => ({
    ...await importOriginal(),
    useParams: () => ({
        uid: 5,
    }),
}));


// Mock API response
// https://github.com/vitest-dev/vitest/discussions/3589
vi.mock('@tanstack/react-query', async (importOriginal) => {
    return {
        ...await importOriginal(),
        useQuery: () => ({
            isLoading: false,
            error: null,
            data: {uid: "hello"},
        })
    };
});


afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
});


describe("the Run component", () => {
    beforeEach(async () => {
        const queryClient = new QueryClient();
        await React.act(async () => {
            render(
                <BrowserRouter>
                  <QueryClientProvider client={queryClient}>
                    <Run />
                  </QueryClientProvider>
                </BrowserRouter>
            );

        });
    });
    it("shows run details", () => {
        expect(screen.getByText("hello")).toBeInTheDocument();
    });
});

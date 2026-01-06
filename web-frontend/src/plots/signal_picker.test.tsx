import * as React from "react";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach  } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { SignalPicker } from "./signal_picker.tsx";


afterEach(() => {
  cleanup();
});


describe("the signal picker widget", () => {
    beforeEach(() => {
    	vi.mock("@tanstack/react-query", async (importOriginal) => {
    	    return {
    		...(await importOriginal()),
    		useQuery: () => ({
    		    isLoading: false,
    		    error: null,
    		    data: {
                        "It-net_current": {
                            "dtype": "number",
                            "shape": [],
                            "units": "A",
                            "source": "derived://It-net_current",
                            "dtype_numpy": "\u003Cf8",
                            "object_name": "It"
                        },
                        "monochromator-gap": {
                            "dtype": "number",
                            "shape": [],
                            "units": "um",
                            "limits": {
                                "control": {
                                    "low": -24105,
                                    "high": -24105
                                },
                                "display": {
                                    "low": -24105,
                                    "high": -24105
                                }
                            },
                            "source": "ca://25idbUP:ACS:m4.RBV",
                            "precision": 3,
                            "dtype_numpy": "\u003Cf8",
                            "object_name": "monochromator"
                        },

    		    },
    		}),
    	    };
    	});
    });
    beforeEach(async () => {
	// getRuns.mockClear();
	const queryClient = new QueryClient();
	await React.act(async () => {
	    render(
		<QueryClientProvider client={queryClient}>
                  <SignalPicker uid="93b837d" stream="primary" />      
		</QueryClientProvider>,
	    );
	});
    });

    it("sets the values from datakeys", () => {
	const options = screen.getAllByRole("option");
	expect(options.length).toEqual(2);
    });
});

import { useState } from "react";

import "@testing-library/jest-dom/vitest";
import { vi, describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { LineInfo, Run } from "./types";
import { Operation } from "./types";
import { SingleRunPicker, SignalPicker } from "./source_picker.tsx";

afterEach(() => {
  cleanup();
});

vi.mock("@tanstack/react-query", async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useQuery: () => ({
      data: {
        baseline: {},
      },
      isLoading: false,
    }),
  };
});
vi.mock("./streaming", async () => {
  return {
    useTiledWebSocket: () => ({
      payload: {
        type: "container-child-created",
        sequence: 1,
        key: "primary",
      },
      readyState: 1,
    }),
  };
});
vi.mock("../tiled", async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useStreams: () => ({
      streams: {
        baseline: {
          data_keys: {
            "I0-frequency": { dtype: "<f8", shape: [] },
            "It-frequency": { dtype: "<f8", shape: [] },
          },
          ancestors: [],
        },
        primary: {
          data_keys: {
            "I0-count": { dtype: "<i4", shape: [] },
          },
          ancestors: [],
        },
      },
    }),
  };
});

const Component = () => {
  const run: Run = {
    uid: "new_run",
    path: "new_run",
    structure_family: "container",
    specs: [],
    metadata: {
      start: {
        time: 0,
        uid: "1234556",
        hints: {
          dimensions: [
            [["It-frequency", "I0-frequency"], "baseline"],
            [["I0-count"], "primary"],
          ],
        },
      },
    },
    structure: {},
  };
  const queryClient = new QueryClient();
  const [lineInfos, setLineInfos] = useState<LineInfo[]>([]);
  return (
    <>
      <div>Signal: {lineInfos[0]?.["x"]?.["name"]}</div>
      <div>Operation: {JSON.stringify(lineInfos[0]?.["operation"])}</div>
      <QueryClientProvider client={queryClient}>
        <SingleRunPicker
          run={run}
          lineInfos={lineInfos}
          setLineInfos={setLineInfos}
        />
        ,
      </QueryClientProvider>
    </>
  );
};

describe("the SingleRunPicker() component", () => {
  it("adds and drops rows", async () => {
    render(<Component />);
    let rows = screen.getAllByRole("row");
    expect(rows.length).toEqual(3);
    // Add a row
    const addButton = screen.getByText("+", { selector: "button" });
    await fireEvent.click(addButton);
    rows = screen.getAllByRole("row");
    expect(rows.length).toEqual(5);
    // Remove a row
    const dropButton = screen.getByText("−", { selector: "button" });
    await fireEvent.click(dropButton);
    rows = screen.getAllByRole("row");
    expect(rows.length).toEqual(3);
  });
  it("lists streams", () => {
    render(<Component />);
    const primaryOptions = screen.getAllByText("primary/");
    expect(primaryOptions).toHaveLength(3);
    const baselineOptions = screen.getAllByText("baseline/");
    expect(baselineOptions).toHaveLength(3);
  });
  it("lists data keys", async () => {
    const signalNames = new Set(["I0-count"]);
    render(
      <SignalPicker
        signalNames={signalNames}
        setSignal={() => {}}
        disabled={false}
        localKey="spam"
      />,
    );
    await screen.findByText("I0-count");
  });
  it("sets line data", async () => {
    const user = userEvent.setup();
    render(<Component />);
    const selectBoxes = screen.getAllByTestId("select-signal");
    await user.selectOptions(selectBoxes[0], "It-frequency");
    await screen.findByText("Signal: It-frequency");
  });
  it("sets reference operation", async () => {
    const user = userEvent.setup();
    render(<Component />);
    const operationSelect = screen.getByRole("combobox", {
      name: "Row 0 reference operation",
    });
    await user.selectOptions(operationSelect, Operation.DIVIDE);
    await screen.findByText('Operation: "÷"');
    await user.selectOptions(operationSelect, "");
    await screen.findByText("Operation: null");
  });
  it("applies simple preset", async () => {
    const user = userEvent.setup();
    render(<Component />);
    const invertCheckbox = screen.getByLabelText(/Inverted/i);
    const logarithmCheckbox = screen.getByLabelText(/Natural logarithm/i);
    const operationInput = screen.getByRole("combobox", {
      name: "Row 0 reference operation",
    });
    // Set up previous UI state so we can tell that things changed
    await user.click(invertCheckbox);
    await user.click(logarithmCheckbox);
    await fireEvent.change(operationInput, { target: { value: "+" } });
    // Activate the new mode
    const simpleButton = screen.getByRole("button", {
      name: "Row 0 simple preset",
    });
    await user.click(simpleButton);
    // Check that other UI element responded properly
    expect(operationInput).toHaveValue("");
    expect(invertCheckbox).not.toBeChecked();
    expect(logarithmCheckbox).not.toBeChecked();
  });
  it("applies fluorescence preset", async () => {
    const user = userEvent.setup();
    render(<Component />);
    const invertCheckbox = screen.getByLabelText(/Inverted/i);
    const logarithmCheckbox = screen.getByLabelText(/Natural logarithm/i);
    const operationInput = screen.getByRole("combobox", {
      name: "Row 0 reference operation",
    });
    // Set up previous UI state so we can tell that things changed
    await user.click(invertCheckbox);
    await user.click(logarithmCheckbox);
    await fireEvent.change(operationInput, { target: { value: "+" } });
    // Activate the new mode
    const fluoroButton = screen.getByRole("button", {
      name: "Row 0 fluorescence preset",
    });
    await user.click(fluoroButton);
    // Check that other UI element responded properly
    expect(operationInput).toHaveValue(Operation.DIVIDE);
    expect(invertCheckbox).not.toBeChecked();
    expect(logarithmCheckbox).not.toBeChecked();
  });
  it("applies transmission preset", async () => {
    const user = userEvent.setup();
    render(<Component />);
    const invertCheckbox = screen.getByLabelText(/Inverted/i);
    const logarithmCheckbox = screen.getByLabelText(/Natural logarithm/i);
    const operationInput = screen.getByRole("combobox", {
      name: "Row 0 reference operation",
    });
    // Set up previous UI state so we can tell that things changed
    // Activate the new mode
    const transButton = screen.getByRole("button", {
      name: "Row 0 transmission preset",
    });
    await user.click(transButton);
    // Check that other UI element responded properly
    expect(operationInput).toHaveValue(Operation.DIVIDE);
    expect(invertCheckbox).toBeChecked();
    expect(logarithmCheckbox).toBeChecked();
  });
});

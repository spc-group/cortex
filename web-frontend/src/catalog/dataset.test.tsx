import "@testing-library/jest-dom/vitest";
import * as zarr from "zarrita";
import { expect, describe, beforeEach, afterEach, it } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { useDatasets } from "./dataset";
import type { DataSource } from "./types";

let root: zarr.Location<zarr.Mutable>;
beforeEach(async () => {
  const zmap = new Map();
  root = zarr.root(zmap);
  await zarr.create(root);
  await zarr.create(root.resolve("spam"), {
    data_type: "int32",
    shape: [11],
    chunk_shape: [11],
  });
  const zarray = await zarr.create(root.resolve("eggs"), {
    data_type: "int32",
    shape: [11, 24, 32],
    chunk_shape: [1, 24, 32],
  });
  for (let i = 0; i < zarray.shape[0]; i++) {
    zarr.set(zarray, [i, null, null], i);
  }
});

afterEach(() => {
  cleanup();
});

describe("the useDatasets() hook", () => {
  const MockComponent = ({
    sources,
  }: {
    sources: { [key: string]: DataSource };
  }) => {
    const { datasets, isLoading } = useDatasets(sources, { zarrRoot: root });
    return (
      <>
        <div>Loading: {JSON.stringify(isLoading)}</div>
        {Object.entries(datasets).map(([name, ds]) => {
          const arr = ds?.data != null ? Array.from(ds.data as number[]) : null;
          return (
            <div key={name}>
              <span>{name}</span>: <span>{JSON.stringify(arr)}</span>
            </div>
          );
        })}
      </>
    );
  };
  it("loads a 1D dataset", async () => {
    const sources = {
      spam: {
        path: "spam",
        dataKey: {
          dtype: "number",
          shape: [11],
          source: "",
        },
      },
    };
    render(<MockComponent sources={sources} />);
    await screen.findByText("Loading: false");
    expect(screen.getByText("spam")).toBeInTheDocument();
    // await screen.findByText(/\[\d+(,\d+)*\]/);
    await screen.findByText(/\[(\d+,\s*){10}\d+\]/);
  });
  it("reduces a 3D dataset", async () => {
    const sources = {
      eggs: {
        path: "eggs",
        dataKey: {
          dtype: "array",
          shape: [11, 24, 32],
          source: "",
        },
      },
    };
    render(<MockComponent sources={sources} />);
    await screen.findByText("Loading: false");
    expect(screen.getByText("eggs")).toBeInTheDocument();
    // Make sure there are only 11 numbers in the resulting array
    await screen.findByText(/\[(\d+,\s*){10}\d+\]/);
    // await screen.findByText(/Blah/);
  });
});

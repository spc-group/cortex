import "@testing-library/jest-dom/vitest";
import * as zarr from "zarrita";
import { useContext } from "react";
import { describe, it, vi, afterEach, expect } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { TiledProvider, ZarrRootContext, TiledContext } from "./";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const MockComponent = () => {
  const zarrRoot = useContext(ZarrRootContext);
  const tiledUri = useContext(TiledContext);
  const store = zarrRoot?.store as zarr.FetchStore;
  const zarrUrl = new URL(store.url);
  return (
    <>
      <div>zarr: {zarrUrl.href} </div>
      <div>tiled: {tiledUri} </div>
    </>
  );
};

describe("the TiledProvider component", () => {
  it("provides the Tiled uri", () => {
    render(
      <TiledProvider uri="http://localhost:0">
        <MockComponent />
      </TiledProvider>,
    );
    expect(
      screen.getByText("tiled: http://localhost:0/api/v1"),
    ).toBeInTheDocument();
  });
  it("provides an explicit zarr root", () => {
    const root = zarr.root(new zarr.FetchStore("http://localhost:0"));
    render(
      <TiledProvider zarrRoot={root}>
        <MockComponent />
      </TiledProvider>,
    );
    expect(screen.getByText("zarr: http://localhost:0/")).toBeInTheDocument();
  });
  it("provides a default zarr root", () => {
    render(
      <TiledProvider uri="http://localhost:0">
        <MockComponent />
      </TiledProvider>,
    );
    expect(
      screen.getByText("zarr: http://localhost:0/zarr/v3"),
    ).toBeInTheDocument();
  });
});

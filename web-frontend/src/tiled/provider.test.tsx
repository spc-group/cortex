import "@testing-library/jest-dom/vitest";
import * as zarr from "zarrita";
import { useContext } from "react";
import { describe, it, vi, afterEach, expect } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import {
  TiledProvider,
  ZarrRootContext,
  TiledContext,
  WebSocketContext,
} from "./";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const MockComponent = () => {
  const zarrRoot = useContext(ZarrRootContext);
  const tiledUri = useContext(TiledContext).baseUri;
  const wsUri = useContext(WebSocketContext);
  const store = zarrRoot?.store as zarr.FetchStore;
  const zarrUrl = new URL(store.url);
  return (
    <>
      <div>zarr: {zarrUrl.href}</div>
      <div>tiled: {tiledUri}</div>
      <div>ws: {wsUri}</div>
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
  it("provides the websockets uri", () => {
    render(
      <TiledProvider uri="http://localhost:0">
        <MockComponent />
      </TiledProvider>,
    );
    expect(
      screen.getByText("ws: ws://localhost:0/api/v1/stream/single"),
    ).toBeInTheDocument();
  });
  it("upgrade websockets uri to wss", () => {
    render(
      <TiledProvider uri="https://localhost:0">
        <MockComponent />
      </TiledProvider>,
    );
    expect(
      screen.getByText("ws: wss://localhost:0/api/v1/stream/single"),
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
  it("parses the URI path", () => {
    // We should be able to use something like
    // http://tiled.example.com/my_group/ as a root path
    render(
      <TiledProvider uri="http://localhost:0/path_root/api/v1/catalog">
        <MockComponent />
      </TiledProvider>,
    );
    expect(
      screen.getByText("tiled: http://localhost:0/path_root/api/v1"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("ws: ws://localhost:0/path_root/api/v1/stream/single"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("zarr: http://localhost:0/path_root/zarr/v3/catalog"),
    ).toBeInTheDocument();
  });
});

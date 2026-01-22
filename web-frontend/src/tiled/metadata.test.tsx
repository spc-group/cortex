import "@testing-library/jest-dom/vitest";
import type { Mock } from "vitest";
import { expect, describe, it, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { useMetadata } from ".";
import { getMetadata } from "./metadata";
import { useTiledWebSocket } from "./streaming";
import type { RunMetadata } from "../types";

vi.mock("./streaming", async () => {
  return {
    useTiledWebSocket: vi.fn(() => {
      return {
        payload: {
          type: "table-schema",
          sequence: 1,
          key: "primary",
        },
        readyState: 1,
      };
    }),
  };
});

vi.mock("@tanstack/react-query", async () => {
  return {
    // ...(await importOriginal()),
    useQuery: () => ({
      isLoading: false,
      data: {
        attributes: { metadata: { start: { scan_name: "hello" } } },
      },
    }),
  };
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe("useMetadata() hook", () => {
  const MockComponent = () => {
    const { metadata, isLoading, readyState } =
      useMetadata<RunMetadata>("catalog/scan");
    const runMetadata = metadata == null ? {} : metadata.attributes.metadata;
    return (
      <>
        <div>Scan: {runMetadata?.start?.scan_name}</div>
        <div>isLoading: {String(isLoading)}</div>
        <div>readyState: {String(readyState)}</div>
      </>
    );
  };
  it("returns http results first ", () => {
    render(<MockComponent />);
    expect(screen.getByText("Scan: hello")).toBeInTheDocument();
  });
  it("returns isLoading from HTTP query", () => {
    render(<MockComponent />);
    expect(screen.getByText("isLoading: false")).toBeInTheDocument();
  });
  it("updates metadata from websocket", () => {
    const newMessage = {
      payload: {
        type: "container-child-metadata-updated",
        key: "scan",
        metadata: {
          attributes: {
            metadata: {
              start: {
                scan_name: "eggs",
              },
            },
          },
        },
      },
    };
    (useTiledWebSocket as Mock).mockImplementation(() => newMessage);
    render(<MockComponent />);
    expect(screen.getByText("Scan: eggs")).toBeInTheDocument();
  });
});

describe("getMetadata()", () => {
  it("returns the metadata", async () => {
    const { data } = await getMetadata("79344606-4efc-4fd3-8ee6-de0528e6577b");
    expect(data.id).toEqual("79344606-4efc-4fd3-8ee6-de0528e6577b");
    expect(data.attributes.metadata.start.uid).toEqual(
      "79344606-4efc-4fd3-8ee6-de0528e6577b",
    );
  });
});

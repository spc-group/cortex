import * as zarr from "zarrita";
import type { ReactElement } from "react";

import { TiledContext, ZarrRootContext, WebSocketContext } from "./context";
import type { ZarrRoot } from "./types";

const trimLeadSlash = (value: string) => {
  return value.replace(/^\/+/, "");
};

const trimEndSlash = (value: string) => {
  return value.replace(/\/+$/, "");
};

const trimSlashes = (value: string) => {
  return trimLeadSlash(trimEndSlash(value));
};

// Parse a Tiled path and extract semantic segments that can be reconstructed later
const parseUriPath = (uri: URL) => {
  let pathRoot, catalog;
  [pathRoot, catalog] = uri.pathname.split("/api/v1");
  catalog = catalog == null ? catalog : trimSlashes(catalog);

  // Make sure there's a trailing slash
  pathRoot = trimEndSlash(pathRoot);
  return {
    pathRoot,
    apiVersion: "1",
    catalog,
  };
};

// Sets up the Tiled contexts with URI's for the various parts of the Tiled server
export const TiledProvider = ({
  uri,
  children,
  zarrRoot,
}: {
  children: ReactElement[] | ReactElement;
  uri?: string;
  zarrRoot?: ZarrRoot;
}) => {
  // Parse the URI
  let httpUri, wsUri, zarrUri, catalog, pathRoot;
  if (uri != null) {
    let apiVersion;
    // Parse input URI to determine the actual server URIs
    httpUri = new URL(uri);
    ({ pathRoot, apiVersion, catalog } = parseUriPath(httpUri));
    httpUri.pathname = trimLeadSlash(`${pathRoot}/api/v${apiVersion}`);
    wsUri = new URL(uri);
    wsUri.protocol = httpUri.protocol === "http:" ? "ws" : "wss";
    wsUri.pathname = `${httpUri.pathname}/stream/single`;
    zarrUri = new URL(uri);
    zarrUri.pathname = `${pathRoot}/zarr/v3`;
    if (catalog) {
      zarrUri.pathname = `${zarrUri.pathname}/${catalog}`;
    }
  }
  // Mutliple wrapped contexts
  let element = children;
  // Set up context for regular API queries
  if (uri != null && httpUri != null && wsUri != null) {
    const tiledInfo = {
      baseUri: httpUri.href,
      pathPrefix: catalog,
    };
    element = (
      <TiledContext value={tiledInfo}>
        <WebSocketContext value={wsUri.href}>{element}</WebSocketContext>
      </TiledContext>
    );
  }
  if (zarrRoot != null) {
    element = <ZarrRootContext value={zarrRoot}>{element}</ZarrRootContext>;
  } else if (zarrUri != null) {
    const root = zarr.root(new zarr.FetchStore(zarrUri.href));
    element = <ZarrRootContext value={root}>{element}</ZarrRootContext>;
  }
  return element;
};

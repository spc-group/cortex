import * as zarr from "zarrita";
import type { ReactElement } from "react";

import { TiledContext, ZarrRootContext, WebSocketContext } from "./context";
import type { ZarrRoot } from "./types";

// Sets up the Tiled contexts with URI's for the various parts of the Tiled server
export const TiledProvider = ({
  uri,
  children,
  pathPrefix,
  zarrRoot,
}: {
  children: ReactElement[] | ReactElement;
  uri?: string;
  pathPrefix?: string;
  zarrRoot?: ZarrRoot;
}) => {
  // Parse the URI
  let httpUri, wsUri;
  if (uri != null) {
    httpUri = new URL(uri);
    wsUri = new URL(uri);
    wsUri.protocol = "ws";
  }
  // Mutliple wrapped contexts
  let element = children;
  // Set up context for regular API queries
  if (uri != null && httpUri != null && wsUri != null) {
    const tiledInfo = {
      baseUri: `${httpUri.origin}/api/v1`,
      pathPrefix: pathPrefix ?? "",
    };
    element = (
      <TiledContext value={tiledInfo}>
        <WebSocketContext value={`${wsUri.origin}/api/v1/stream/single`}>
          {element}
        </WebSocketContext>
      </TiledContext>
    );
  }
  if (zarrRoot != null) {
    element = <ZarrRootContext value={zarrRoot}>{element}</ZarrRootContext>;
  } else if (httpUri != null) {
    let zarrUri = `${httpUri.origin}/zarr/v3`;
    if (pathPrefix != null) {
      zarrUri = `${zarrUri}/${pathPrefix}`;
    }
    const root = zarr.root(new zarr.FetchStore(zarrUri));
    element = <ZarrRootContext value={root}>{element}</ZarrRootContext>;
  }
  return element;
};

import * as zarr from "zarrita";
import type { ReactElement } from "react";

import { TiledContext, ZarrRootContext, WebSocketContext } from "./context";
import type { ZarrRoot } from "./types";

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
    element = (
      <TiledContext value={`${httpUri.origin}/api/v1`}>
        <WebSocketContext value={`${wsUri.origin}/api/v1/stream/single`}>
          {element}
        </WebSocketContext>
      </TiledContext>
    );
  }
  if (zarrRoot != null) {
    element = <ZarrRootContext value={zarrRoot}>{element}</ZarrRootContext>;
  } else if (httpUri != null) {
    const zarrUri = `${httpUri.origin}/zarr/v3`;
    const root = zarr.root(new zarr.FetchStore(zarrUri));
    element = <ZarrRootContext value={root}>{element}</ZarrRootContext>;
  }
  return element;
};

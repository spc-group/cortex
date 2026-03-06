import * as zarr from "zarrita";
import type { ReactElement } from "react";

import { TiledContext, ZarrRootContext } from "./context";
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
  let baseUri = "";
  if (uri != null) {
    const url = new URL(uri);
    baseUri = url.origin;
  }
  // Mutliple wrapped contexts
  let element = children;
  // Set up context for regular API queries
  if (uri != null) {
    element = (
      <TiledContext value={`${baseUri}/api/v1`}>{element}</TiledContext>
    );
  }
  if (zarrRoot != null) {
    element = <ZarrRootContext value={zarrRoot}>{element}</ZarrRootContext>;
  } else if (uri != null) {
    const zarrUri = `${baseUri}/zarr/v3`;
    const root = zarr.root(new zarr.FetchStore(zarrUri));
    element = <ZarrRootContext value={root}>{element}</ZarrRootContext>;
  }
  return element;
};

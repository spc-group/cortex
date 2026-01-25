import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import { ReadyState } from "react-use-websocket";

import { useTiledWebSocket } from "./streaming";
import { v1Client as v1Client } from "./tiled_api";
import type { WebSocketContainer, NodeMetadata } from "./types";

// HTTP Call to GET the node's metadata
export const getMetadata = async (
  path: string,
  { client }: { client?: AxiosInstance } = {},
) => {
  const client_ = client ?? v1Client;
  const response = await client_.get(`metadata/${encodeURIComponent(path)}`, {
    params: {},
  });
  return response.data.data;
};

// Hook that delivers the latest metadata for a path, updated by
// websockets
//
// Note: "Metadata" here refers to the Tiled metadata block, no
// necessarily the metadata contained within, such as Bluesky
// start/stop documents, etc.
//
// @params path - The Tiled URI path for the requested metadata
// @returns metadata - The metadata for the request node.
// @returns isLoading - Whether the original HTTP GET request has completed.
// @return readyState - The latest state of the websocket connection.
export const useMetadata = <M, S = object>(
  path: string,
): {
  metadata: NodeMetadata<M, S> | null;
  isLoading: boolean;
  readyState: ReadyState;
} => {
  // Parse the path to get its parent
  const bits = path.split("/");
  const parent = bits.slice(0, -1).join("/");
  const [key] = bits.slice(-1);
  // State for keeping track of the latest metadata
  const metadataRef = useRef<NodeMetadata<M, S> | null>(null);
  // Get initial data by HTTP
  const { isLoading, data: httpData } = useQuery({
    queryFn: async () => {
      if (path == null) {
        return null;
      }
      return await getMetadata(path);
    },
    queryKey: ["metadata", path],
  });
  if (metadataRef.current == null && !isLoading) {
    // First pass, so set the metadata
    metadataRef.current = httpData;
  }
  // Get updates via websockets
  const { payload, readyState } =
    useTiledWebSocket<WebSocketContainer<M>>(parent);
  if (
    payload?.type === "container-child-metadata-updated" &&
    payload?.key === key &&
    metadataRef.current != null
  ) {
    // Websocket wins, so update state
    metadataRef.current.attributes.metadata = payload.metadata;
  }
  return { metadata: metadataRef.current, isLoading, readyState };
};

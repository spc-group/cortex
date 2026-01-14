import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
// import useWebSocket from "react-use-websocket";

import type { Stream, WebSocketNode, DataKey } from "../types";
import { useTiledWebSocket } from "./streaming";
import { getStreams } from "./tiled_api.ts";

export function streamsAreEqual(
  a: { [key: string]: Stream },
  b: { [key: string]: Stream },
) {
  // Check for stream keys
  const aKeys = new Set(Object.keys(a));
  const bKeys = new Set(Object.keys(b));
  if (!compareSets(aKeys, bKeys)) return false;
  // Check for stream ancestors
  for (const [key, stream] of Object.entries(a)) {
    if (
      JSON.stringify(stream?.ancestors) !== JSON.stringify(b[key]?.ancestors)
    ) {
      return false;
    }
  }
  return true;
}

function compareSets(a: Set<string>, b: Set<string>) {
  return a.size === b.size && [...a].every((x) => b.has(x));
}

interface WebSocketStream extends WebSocketNode {
  metadata: {
    data_keys: { [key: string]: DataKey };
    uid: string;
    time: number;
    hints: { [key: string]: { fields: string[] } };
    configuration: { [key: string]: object };
  };
}

export const useStreams = (uid: string) => {
  const [streams, setStreams] = useState<{ [key: string]: Stream }>({});
  // Watch for new runs coming from websockets
  const url = `stream/single/${uid}?envelope_format=msgpack`;
  const { payload, readyState } = useTiledWebSocket<WebSocketStream>(url);
  const wsStreams: { [key: string]: Stream } = {};
  if (payload?.type === "container-child-created") {
    wsStreams[payload.key] = {
      ancestors: [uid],
      structure_family: payload.structure_family,
      specs: payload.specs,
      data_keys: payload.metadata?.data_keys ?? {},
      configuration: payload.metadata?.configuration ?? {},
      hints: payload.metadata?.hints ?? {},
      time: payload.metadata?.time,
      key: payload.key,
      uid: payload.metadata?.uid,
    };
  }
  // Get streams by HTTP request to compare
  const { data: queryStreams, isLoading } = useQuery({
    queryFn: async () => {
      return await getStreams(uid);
    },
    queryKey: [uid],
  });
  // Check if the combined streams are different than what we had before
  const newStreams: { [key: string]: Stream } = {
    ...streams,
    ...queryStreams,
    ...wsStreams,
  };
  if (!streamsAreEqual(streams, newStreams)) {
    // We have new entries, so update state
    setStreams(newStreams);
  }
  return { streams, isLoading, readyState };
};

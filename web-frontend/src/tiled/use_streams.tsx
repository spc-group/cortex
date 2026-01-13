import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
// import useWebSocket from "react-use-websocket";

import { useTiledWebSocket } from "./streaming";
import { getStreams, tiledUri } from "./tiled_api.ts";
import { makeWebsocketUrl, useDecodeBlob } from "./streaming";


export function streamsAreEqual(a, b) {
  // Check for stream keys
  const aKeys = new Set(Object.keys(a));
  const bKeys = new Set(Object.keys(b));
  if (!compareSets(aKeys, bKeys)) return false;
  // Check for stream ancestors
  for (const [key, stream] of Object.entries(a)) {
    if (JSON.stringify(stream?.ancestors) !== JSON.stringify(b[key]?.ancestors)) {
      return false;
    }
  }
  return true
}

function compareSets(a, b) {
  return a.size === b.size &&
    [...a].every((x) => b.has(x));
}

export const useStreams = (uid: string) => {
  const [streams, setStreams] = useState<{[key: string]: Stream}>({});
  // Watch for new runs coming from websockets
  const url = `stream/single/${uid}?envelope_format=msgpack`;
  const { payload, readyState } = useTiledWebSocket(url);
  const wsStreams: {[key: string]: Stream} = {};
  if (payload?.type === "container-child-created") {
    wsStreams[payload.key] = {
      ancestors: [uid],
      structure_family: payload.structure_family,
      specs: payload.specs,
      data_keys: payload.metadata?.data_keys ?? {},
      configuration: payload.metadata?.configuration ?? {},
      hints: payload.metadata?.hints ?? {},
      time: payload.time,
      key: payload.key,
      uid: payload.uid,
    }
  }
  // Get streams by HTTP request to compare
  const {data: queryStreams, isLoading, error} = useQuery({
    queryFn: async() => {
      return await getStreams(uid)
    },
    queryKey: [uid],
  });
  // Check if the combined streams are different than what we had before
  const newStreams = {...streams, ...queryStreams, ...wsStreams};
  if (!streamsAreEqual(streams, newStreams)) {
    // We have new entries, so update state
    setStreams(newStreams);
  }
  return {streams, isLoading};
};

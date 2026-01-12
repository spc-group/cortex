import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
// import useWebSocket from "react-use-websocket";

import { useTiledWebSocket as useWebSocket } from "./streaming";
import { getStreams, tiledUri } from "./tiled_api.ts";
import { makeWebsocketUrl, useDecodeBlob } from "./streaming";


function compareArrays(a1, a2) {
    const s1 = new Set(a1);
    const s2 = new Set(a2);

    if (s1.size !== s2.size) {
        return false;
    }

    for (const item of s1) {
        if (!s2.has(item)) {
            return false;
        }
    }
    return true;
}

export const useStreams = (uid: string) => {
  const [streams, setStreams] = useState([]);
  // Monitor for new streams through websockets
  const webSocket = useWebSocket;
  // Watch for new runs coming from websockets
  const url = makeWebsocketUrl(
    `${tiledUri}stream/single/${uid}?envelope_format=msgpack`,
  );
  const { lastMessage, readyState } = webSocket(url);
  // Decode the msgpack response
  const [blob, setBlob] = useState<Blob>(new Blob());
  const [message, setMessage] = useState<{ sequence?: number; key?: string }>(
    {},
  );
  if (lastMessage?.data !== blob) {
    setBlob(lastMessage?.data);
  }
  useDecodeBlob(blob, setMessage);
  const {data: oldStreams, isLoading, error} = useQuery({
    queryFn: async() => {
      return await getStreams(uid)
    },
    queryKey: [uid, message?.sequence],
  });
  let newStreams;
  if (message?.key != null) {
    newStreams = [message.key, ...(oldStreams ?? streams)];
  } else {
    newStreams = oldStreams;
  }
  // Check if the list has changed
  const arraysDiffer = (newStreams != null && !compareArrays(streams, newStreams));
  if (arraysDiffer) {
    setStreams(newStreams);
  }
  return {streams, isLoading};
};

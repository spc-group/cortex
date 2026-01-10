import { decode, decodeAsync } from "@msgpack/msgpack";
import { useState, useEffect } from "react";
import useWebSocket from "react-use-websocket";

import { useRuns } from "./runs_hook";
import { tiledUri, streamsPrefix } from "./tiled_api";
import type { webSocketMessage } from "./types";

// Decode a msgpack formatted blob into a javascript object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useDecodeBlob = (blob: Blob | null, setDecoded: (a: any) => void) => {
  useEffect(() => {
    const decodeFromBlob = async () => {
      let decoded: unknown;
      if (blob == null) {
        decoded = null;
      } else if (blob?.stream) {
        // Blob#stream(): ReadableStream<Uint8Array> (recommended)
        decoded = await decodeAsync(blob.stream());
      } else {
        // Blob#arrayBuffer(): Promise<ArrayBuffer> (if stream() is not available)
        decoded = decode(await blob.arrayBuffer());
      }
      setDecoded(decoded);
    };
    decodeFromBlob();
  }, [blob, setDecoded]);
};

// Convert a (maybe) http URL for the tiled server into a websocket
// url.
// @param httpUrl: The HTTP equivalent url that will be parsed
// @returns A similar URL but formatted to be a websocket (i.e. ws:// or wss://)

const makeWebsocketUrl = (httpUrl: string): string => {
  const url = new URL(httpUrl);
  url.protocol = "ws";
  return url.href;
};

export const useLatestRun = ({
  webSocketHook,
  beamlineId,
}: {
  beamlineId: string;
  webSocketHook?: (a: string) => webSocketMessage;
}) => {
  const webSocket = webSocketHook ?? useWebSocket;
  // Watch for new runs coming from websockets
  const url = makeWebsocketUrl(
    `${tiledUri}stream/single/?envelope_format=msgpack`,
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
  const wsUID = message?.key ?? null;
  // Get the latest run through a regular query as a fallback
  const {
    runs,
    runCount,
    isLoading: isLoadingRuns,
  } = useRuns({
    sortField: "-start.time",
    filters: {
      "start.beamline_id": beamlineId,
    },
    pageLimit: 1,
    pageOffset: 0,
  });
  let fetchedUID;
  if (isLoadingRuns || runCount === 0) {
    fetchedUID = null;
  } else {
    fetchedUID = runs[0]?.["start.uid"] ?? null;
  }
  // Return the results, preferring websocket results over fetch
  return {
    latestUID: wsUID ?? fetchedUID,
    readyState: readyState,
    sequence: message?.sequence,
  };
};

export const useLatestData = (
  uid: string,
  stream: string,
  { webSocketHook }: { webSocketHook?: (a: string) => webSocketMessage },
) => {
  const useSocket = webSocketHook ?? useWebSocket;
  const url = makeWebsocketUrl(
    `${tiledUri}stream/single/${uid}/${streamsPrefix}${stream}?envelope_format=msgpack`,
  );
  // console.log(webSocketHook._isMockFunction);
  const { lastMessage, readyState } = useSocket(url);
  // Decode the msgpack response
  const [blob, setBlob] = useState<Blob>(new Blob());
  const [message, setMessage] = useState<{ sequence?: number } | null>(null);
  if (lastMessage?.data !== blob) {
    setBlob(lastMessage?.data);
  }
  useDecodeBlob(blob, setMessage);
  return {
    readyState: readyState,
    sequence: message?.sequence ?? null,
  };
};

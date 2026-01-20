import { tableFromIPC } from "apache-arrow";
import { decode, decodeAsync } from "@msgpack/msgpack";
import { useState, useEffect } from "react";
import useWebSocket from "react-use-websocket";

import { tiledUri } from "./tiled_api";

type BlobLike = {
  arrayBuffer?: () => Uint8Array;
};

// Convert a msgpack payload into its native object equivalent
// @param encoded - The msgpack'd binary data that will be encoded.
export const decodeMsgPack = async (encoded: BlobLike) => {
  let decoded: { payload?: Uint8Array; mimetype?: string };
  if (encoded == null) {
    decoded = null;
  } else if (encoded?.stream != null) {
    // Blob#stream(): ReadableStream<Uint8Array> (recommended)
    decoded = await decodeAsync(encoded.stream());
  } else {
    // Blob#arrayBuffer(): Promise<ArrayBuffer> (if stream() is not available)
    decoded = decode(await encoded.arrayBuffer());
  } //  else {
  //   // Just a regular array buffer (e.g. used in testing
  //   decoded = decode(encoded);
  // }
  // Decode the awkward array if present
  if (decoded?.mimetype === "application/vnd.apache.arrow.file") {
    return {
      ...decoded,
      payload: tableFromIPC(decoded.payload),
    };
  }
  return decoded;
};

// Decode a msgpack formatted blob into a javascript object
export const useDecodeBlob = (
  blob: Blob | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setDecoded: (a: any) => void,
) => {
  useEffect(() => {
    const decodeFromBlob = async () => {
      if (blob != null) {
        // Ignore uses from before a blob is available.

        setDecoded(await decodeMsgPack(blob));
      }
    };
    decodeFromBlob();
  }, [blob, setDecoded]);
};

export const useTiledWebSocket = <T>(path: string) => {
  const wsUrl = makeWebsocketUrl(
    `${tiledUri}stream/single/${path}?envelope_format=msgpack`,
  );
  const { lastMessage, readyState } = useWebSocket(wsUrl);
  // Hacky useEffect to decode the blob asynchronously
  const [blob, setBlob] = useState<Blob>(new Blob());
  const [payload, setPayload] = useState<T>();
  if (lastMessage?.data !== blob) {
    setBlob(lastMessage?.data);
  }
  useDecodeBlob(blob, setPayload);
  const result = {
    lastMessage,
    payload,
    readyState,
  };
  return result;
};

// Convert a (maybe) http(s) URL for the tiled server into a websocket
// url.
// @param httpUrl: The HTTP equivalent url that will be parsed
// @returns A similar URL but formatted to be a websocket (i.e. ws:// or wss://)
export const makeWebsocketUrl = (httpUrl: string): string => {
  const url = new URL(httpUrl);
  const newProtocol = {
    "http:": "ws:",
    "https:": "wss:",
  }[url.protocol];
  if (newProtocol != null) {
    url.protocol = newProtocol;
  }
  return url.href;
};

// export const useLatestData = (uid: string, stream: string) => {
//   const url = `stream/single/${uid}/${stream}/internal?envelope_format=msgpack`;
//   const { lastMessage, readyState } = useTiledWebSocket(url);
//   // Decode the msgpack response
//   const [blob, setBlob] = useState<Blob>(new Blob());
//   const [message, setMessage] = useState<{ sequence?: number } | null>(null);
//   if (lastMessage?.data !== blob) {
//     setBlob(lastMessage?.data);
//   }
//   useDecodeBlob(blob, setMessage);
//   if (message?.type === "table-data") {
//     console.log(message.payload.toArray());
//   }
//   return {
//     readyState: readyState,
//     sequence: message?.sequence ?? null,
//   };
// };

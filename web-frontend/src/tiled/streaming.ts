import { tableFromIPC } from "apache-arrow";
import { decode, decodeAsync } from "@msgpack/msgpack";
import { useState, useEffect, useContext } from "react";
import useWebSocket from "react-use-websocket";

import { WebSocketContext } from "./context";

type RawMsgPack = {
  payload?: Uint8Array;
  mimetype?: string;
  type?: string;
};

// Convert a msgpack payload into its native object equivalent
// @param encoded - The msgpack'd binary data that will be encoded.
export const decodeMsgPack = async (encoded: Blob) => {
  let decoded: RawMsgPack;
  if (encoded == null) {
    return null;
  } else if (encoded?.stream != null) {
    // Blob#stream(): ReadableStream<Uint8Array> (recommended)
    decoded = (await decodeAsync(encoded.stream())) as RawMsgPack;
  } else {
    // Blob#arrayBuffer(): Promise<ArrayBuffer> (if stream() is not available)
    decoded = decode(await encoded.arrayBuffer()) as RawMsgPack;
  }
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
        // Ignore calls from before a blob is available.
        setDecoded(await decodeMsgPack(blob));
      }
    };
    decodeFromBlob();
  }, [blob, setDecoded]);
};

export const useTiledWebSocket = <T>(path: string) => {
  const wsRoot = useContext(WebSocketContext);
  const wsUrl = `${wsRoot}/${path}?envelope_format=msgpack`;
  const { lastMessage, readyState } = useWebSocket<T>(wsUrl, {
    retryOnError: true,
    reconnectAttempts: 10,
    reconnectInterval: (attemptNumber) =>
      // Exponential increase in reconnect internal
      Math.min(Math.pow(2, attemptNumber) * 100, 10000),
  });
  // Hacky useEffect to decode the blob asynchronously
  const [blob, setBlob] = useState<Blob>(new Blob());
  const [payload, setPayload] = useState<T>();
  const [timestamp, setTimestamp] = useState<number>(0);
  if (lastMessage?.data !== blob) {
    setBlob(lastMessage?.data);
    const newTimestamp = lastMessage?.timeStamp ?? timestamp;
    if (newTimestamp > timestamp) {
      setTimestamp(newTimestamp);
    }
  }
  useDecodeBlob(blob, setPayload);
  const result = {
    lastMessage,
    payload,
    readyState,
    timestamp,
  };
  return result;
};

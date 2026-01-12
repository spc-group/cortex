import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import useWebSocket from "react-use-websocket";

import { getDataKeys, tiledUri } from "./tiled_api.ts";
import { makeWebsocketUrl, useDecodeBlob } from "./streaming";

export const useDataKeys = (uid?: string, stream?: string) => {
  const [dataKeys, setDataKeys] = useState({});
  const url = makeWebsocketUrl(
    `${tiledUri}stream/single/${uid}/${stream}?envelope_format=msgpack`,
  );
  const { lastMessage, readyState } = useWebSocket(url);
  const [blob, setBlob] = useState<Blob>(new Blob());
  const [message, setMessage] = useState<{ sequence?: number; key?: string }>(
    {},
  );
  if (lastMessage?.data !== blob) {
    setBlob(lastMessage?.data);
  }
  useDecodeBlob(blob, setMessage);

  const loadDataKeys = async () => {
    if (uid == null || stream == null) {
      return { data: null };
    }
    return await getDataKeys(uid, stream);
  };
  const response = useQuery({
    queryKey: ["signal-picker-datakeys", uid, stream],
    queryFn: loadDataKeys,
  });
  return response;
};

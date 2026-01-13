import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { getDataKeys, tiledUri } from "./tiled_api.ts";
import { makeWebsocketUrl, useDecodeBlob, useTiledWebSocket } from "./streaming";

export const useDataKeys = (uid?: string, stream?: string) => {
  const [dataKeys, setDataKeys] = useState({});
  const url = `stream/single/${uid}/${stream}?envelope_format=msgpack`;
  const { lastMessage, readyState } = useTiledWebSocket(url);
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
  return {
    data: response.data,
  };
};

// response.data for a scan
// {
//     "stage-x": {
//         "dtype": "number",
//         "shape": [],
//         "source": "soft://stage-x",
//         "dtype_numpy": "<f8",
//         "object_name": "stage-x"
//     },
//     "det-channel-1-value": {
//         "dtype": "integer",
//         "shape": [],
//         "source": "soft://det-channel-1-value",
//         "dtype_numpy": "<i8",
//         "object_name": "det"
//     },
//     "det-channel-2-value": {
//         "dtype": "integer",
//         "shape": [],
//         "source": "soft://det-channel-2-value",
//         "dtype_numpy": "<i8",
//         "object_name": "det"
//     },
//     "det-channel-3-value": {
//         "dtype": "integer",
//         "shape": [],
//         "source": "soft://det-channel-3-value",
//         "dtype_numpy": "<i8",
//         "object_name": "det"
//     }
// }

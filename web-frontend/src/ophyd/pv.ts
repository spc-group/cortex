import { useState, useRef, useContext } from "react";
import useWebSocket from "react-use-websocket";

import { OphydContext } from "./context";

export const usePV = (pv: string) => {
  const [value, setValue] = useState(null);
  const timestamps = useRef({
    value: 0,
    meta: 0,
  });
  const [enumStrs, setEnumStrs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [precision, setPrecision] = useState(0);
  const [units, setUnits] = useState("");
  // Establish the websocket connection
  const baseUri = useContext(OphydContext);
  const { lastMessage, sendMessage, readyState } = useWebSocket(
    `${baseUri}/api/v1/pv-socket`,
    {
      share: true,
      onOpen: () => {
        sendMessage(
          JSON.stringify({
            action: "subscribeReadOnly",
            pv: pv,
          }),
        );
      },
    },
  );
  const lastData = JSON.parse(lastMessage?.data ?? "null");
  if (lastData == null || lastData?.pv !== pv) {
    // Filter out messages that aren't for us
  } else if (
    lastData?.sub_type === "meta" &&
    lastData.timestamp > timestamps.current.meta
  ) {
    // This message contains new metadata
    setPrecision(lastData.precision);
    setUnits(lastData.units);
    timestamps.current.meta = lastData.timestamp;
    setConnected(lastData.connected);
    setEnumStrs(lastData.enum_strs);
  } else if (lastData.timestamp > timestamps.current.value) {
    // This message contains a new value
    timestamps.current.value = lastData.timestamp;
    setValue(lastData.value);
    setConnected(lastData.connected);
  }
  // Convert enums into strings
  let returnValue;
  if (enumStrs != null && value != null) {
    returnValue = enumStrs[value];
  } else {
    returnValue = value;
  }
  // const

  return {
    value: returnValue,
    timestamp: new Date(timestamps.current.value * 1000),
    precision,
    units,
    connected,
    readyState,
  };
};

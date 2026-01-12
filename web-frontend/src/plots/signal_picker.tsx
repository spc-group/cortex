// import { useState } from "react";
import type { ChangeEventHandler } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDataKeys } from "../tiled/tiled_api.ts";
import { useDataKeys } from "../tiled/use_data_keys";


export const SignalPicker = ({
  uid,
  stream,
  currentSignal,
  onSignalChange,
  disabled = false,
  error = false,
}: {
  uid?: string;
  stream: string;
  currentSignal?: string;
  onSignalChange?: ChangeEventHandler;
  disabled?: boolean;
  error?: boolean;
}) => {
  const { data } = useDataKeys(uid, stream);
  let signals: string[];
  if (data == null) {
    signals = [];
  } else {
    signals = Object.keys(data);
  }
  signals = signals.sort();
  return (
    <select
      className={"select" + (error ? " border-yellow-400" : "")}
      disabled={disabled}
      role="listbox"
      value={currentSignal}
      onChange={onSignalChange}
    >
      <option>---</option>
      {signals.map(function (signal) {
        return <option key={signal}>{signal}</option>;
      })}
      <option key="seq_num">seq_num</option>
      <option key="time">time</option>
    </select>
  );
};

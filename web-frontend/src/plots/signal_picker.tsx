import type { ChangeEventHandler } from "react";

import type { Stream } from "../types";

export const SignalPicker = ({
  stream,
  currentSignal,
  onSignalChange,
  disabled = false,
  error = false,
}: {
  uid?: string;
  stream: Stream;
  currentSignal?: string;
  onSignalChange?: ChangeEventHandler;
  disabled?: boolean;
  error?: boolean;
}) => {
  // Prepare the list of signals from the stream's data keys
  if (stream?.data_keys == null) {
    console.error("Stream metadata did not contain data keys.", stream);
  }
  let signals: string[] = Object.keys(stream?.data_keys ?? {});
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

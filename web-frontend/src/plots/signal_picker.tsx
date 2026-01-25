import type { ChangeEventHandler } from "react";

import type { DataKey } from "../catalog/types";

export const SignalPicker = ({
  dataKeys,
  currentSignal,
  onSignalChange,
  disabled = false,
  error = false,
}: {
  dataKeys: { [key: string]: DataKey };
  currentSignal?: string;
  onSignalChange?: ChangeEventHandler;
  disabled?: boolean;
  error?: boolean;
}) => {
  // Prepare the list of signals from the stream's data keys
  let signals: string[] = Object.keys(dataKeys);
  signals = signals.sort();

  return (
    <select
      className={"select" + (error ? " border-yellow-400" : "")}
      disabled={disabled}
      role="listbox"
      value={currentSignal}
      onChange={onSignalChange}
    >
      {signals.map(function (signal) {
        return <option key={signal}>{signal}</option>;
      })}
      <option key="seq_num">seq_num</option>
      <option key="time">time</option>
    </select>
  );
};

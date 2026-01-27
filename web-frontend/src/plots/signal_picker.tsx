import type { ChangeEventHandler, ChangeEvent } from "react";
import { useState } from "react";

import type { DataKey } from "../catalog/types";
import { useLastChoice } from "./last_choice.ts";

export const SignalPicker = ({
  dataKeys,
  onSignalChange,
  disabled = false,
  error = false,
  localKey,
  hints,
}: {
  dataKeys: { [key: string]: DataKey };
  onSignalChange?: ChangeEventHandler;
  disabled?: boolean;
  error?: boolean;
  localKey: string;
  hints?: string[];
}) => {
  const hasHints = (hints ?? []).length > 0;
  const [hintsOnly, setHintsOnly] = useState(hasHints);
  // Prepare the list of signals from the stream's data keys
  let signals: string[] = Object.keys(dataKeys);
  const hints_ = hints ?? [];
  if (hintsOnly) {
    signals = signals.filter((sig) => hints_.includes(sig));
  }
  signals = signals.sort();

  // Get a default signal to start with
  const [signal, setSignal] = useLastChoice<string>("", signals, localKey);

  const onChangeHandler = (event: ChangeEvent<HTMLSelectElement>) => {
    if (onSignalChange != null) {
      onSignalChange(event); // <- change this pass value instead of event
    }
    setSignal(event.currentTarget.value);
  };
  return (
    <>
      <select
        className={"select" + (error ? " border-yellow-400" : "")}
        disabled={disabled}
        role="listbox"
        value={signal ?? ""}
        onChange={onChangeHandler}
      >
        {signals.map(function (signal) {
          return <option key={signal}>{signal}</option>;
        })}
        {!hintsOnly ? (
          <>
            <option key="seq_num">seq_num</option>
            <option key="time">time</option>
          </>
        ) : (
          <></>
        )}
      </select>
      <label className={`label ${!hasHints ? "hidden" : ""}`}>
        <input
          type="checkbox"
          checked={hintsOnly}
          disabled={disabled}
          onChange={(e) => {
            setHintsOnly(e.currentTarget.checked);
          }}
          className="checkbox checkbox-xs"
        />
        Use hints
      </label>
    </>
  );
};

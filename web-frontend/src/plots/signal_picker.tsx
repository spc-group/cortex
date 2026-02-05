import type { ChangeEvent } from "react";

export const SignalPicker = ({
  signals,
  signal,
  onSignalChange,
  disabled = false,
  error = false,
  label,
}: {
  signals: string[];
  signal: string;
  onSignalChange?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  localKey: string;
  label?: string;
}) => {
  const onChangeHandler = (event: ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.currentTarget.value;
    if (onSignalChange != null) {
      onSignalChange(newValue);
    }
  };
  return (
    <>
      <label className="select">
        {label == null ? <></> : <span className="label">{label}</span>}
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
        </select>
      </label>
    </>
  );
};

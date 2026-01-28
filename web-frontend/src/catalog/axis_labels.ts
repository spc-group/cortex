import type { DataKey } from "./types";

export const OPERATIONS = ["+", "−", "×", "÷"];

type Signal = [string, DataKey | null];

export const axisLabels = ({
  xSignal,
  vSignal,
  rSignal,
  operation,
  inverted,
  logarithm,
}: {
  xSignal: Signal;
  vSignal: Signal;
  rSignal: Signal;
  operation: string;
  inverted: boolean;
  logarithm: boolean;
}) => {
  let ylabel = vSignal[0];
  if (OPERATIONS.includes(operation)) {
    ylabel = `${ylabel} ${operation} ${rSignal}`;
  }
  if (inverted) {
    ylabel = `( ${ylabel} )⁻`;
  }
  if (logarithm) {
    ylabel = `ln( ${ylabel} )`;
  }
  return {
    x: xSignal?.[0],
    y: ylabel,
  };
};

import type { DataKey } from "./types";
import type { LineInfo } from "./types";

export const OPERATIONS = ["+", "−", "×", "÷"];

type Signal = [string, DataKey | null];

const infoLabel = (info: LineInfo) => {
  let ylabel = info.s?.name ?? "";
  const xunits = info.x?.dataKey?.units;
  if (OPERATIONS.includes(info.operation)) {
    ylabel = `${ylabel} ${info.operation} ${info.r.name}`;
  }
  if (info.inverted) {
    ylabel = `( ${ylabel} )⁻`;
  }
  if (info.logarithm) {
    ylabel = `ln( ${ylabel} )`;
  }
  let xlabel = info?.x?.name ?? "";
  if (xunits != null) {
    xlabel = `${xlabel} /${xunits}`;
  }
  return {
    x: xlabel,
    y: ylabel,
  };
};

export const axisLabels = (lineInfos: LineInfo[]) => {
  const labels = lineInfos.map(infoLabel);
  // We should show each line's label on a separate text line
  const xLabels = new Set(labels.map((lbl) => lbl.x));
  const yLabels = new Set(labels.map((lbl) => lbl.y));
  const NEWLINE = "<br>";
  return {
    x: Array.from(xLabels).join(NEWLINE),
    y: Array.from(yLabels).join(NEWLINE),
  };
};

export const oldAxisLabels = ({
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
  let ylabel = vSignal?.[0] ?? "";
  if (OPERATIONS.includes(operation)) {
    ylabel = `${ylabel} ${operation} ${rSignal}`;
  }
  if (inverted) {
    ylabel = `( ${ylabel} )⁻`;
  }
  if (logarithm) {
    ylabel = `ln( ${ylabel} )`;
  }
  let xlabel = xSignal?.[0] ?? "";
  if (xSignal[1]?.units) {
    xlabel = `${xlabel} /${xSignal[1].units}`;
  }
  return {
    x: xlabel,
    y: ylabel,
  };
};

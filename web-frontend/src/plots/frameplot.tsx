import { useState } from "react";
import type { ChangeEvent } from "react";
import type { Data } from "plotly.js";
import Plot from "react-plotly.js";

import type { TypedArray } from "../tiled/types";

// A component that lets the user selected a range by min/max or center/width
export const RangePicker = ({
  min,
  max,
  top,
  bottom,
  setTop,
  setBottom,
  disable,
}: {
  min: number;
  max: number;
  top: number;
  bottom: number;
  setTop: (value: number) => void;
  setBottom: (value: number) => void;
  disable?: boolean;
}) => {
  const center = (top + bottom) / 2;
  const width = top - bottom;

  const updateRange = (kind: string) => {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.currentTarget.value);
      if (kind === "bottom") {
        setBottom(value);
        setTop(Math.max(value + 1, top));
      } else if (kind === "top") {
        setTop(value);
        setBottom(Math.min(value - 1, bottom));
      } else if (kind === "center") {
        setTop(Math.min(value + width / 2, max));
        setBottom(Math.max(value - width / 2, min));
      } else if (kind === "width") {
        setTop(Math.min(center + value / 2, max));
        setBottom(Math.max(center - value / 2, min));
      }
    };
  };
  return (
    <div className="space-y-2">
      <div className="flex space-x-1">
        <label className="label">
          Min:
          <input
            type="range"
            className="range"
            min={min}
            max={max}
            value={bottom}
            onChange={updateRange("bottom")}
            disabled={disable}
          />
        </label>
        <input
          className="input"
          disabled={disable}
          type="number"
          value={bottom}
          onChange={updateRange("bottom")}
        />
      </div>
      <div className="flex space-x-1">
        <label className="label">
          Max:
          <input
            type="range"
            className="range"
            min={min}
            max={max}
            value={top}
            onChange={updateRange("top")}
            disabled={disable}
          />
        </label>
        <input
          className="input"
          disabled={disable}
          type="number"
          value={top}
          onChange={updateRange("top")}
        />
      </div>
      <div className="flex space-x-1">
        <label className="label">
          Brightness:
          <input
            type="range"
            className="range"
            min={min}
            max={max}
            value={String(center)}
            onChange={updateRange("center")}
            disabled={disable}
          />
        </label>
        <input
          className="input"
          disabled={disable}
          type="number"
          value={String(center)}
          onChange={updateRange("center")}
        />
      </div>
      <div className="flex space-x-1">
        <label className="label">
          Contrast:
          <input
            type="range"
            className="range"
            style={{ direction: "rtl" }}
            min={1}
            max={max - min}
            value={width}
            onChange={updateRange("width")}
            disabled={disable}
          />
        </label>
        <input
          className="input"
          disabled={disable}
          type="number"
          value={width}
          onChange={updateRange("width")}
        />
      </div>
    </div>
  );
};

// Show a frame in a plot.
//
// If the "auto" checkbox is checked, the color range will be from
// fMin - fMax, otherwise it will be provided by the user somewhere
// between vMin and vMax.
export const FramePlot = ({
  frame,
  vMin,
  vMax,
}: {
  frame: TypedArray[];
  vMin: number;
  vMax: number;
}) => {
  // E.g. /api/v1/array/block/04d28613-b2c4-4b5c-ba31-6aff5c49922d/streams/primary/ge_13element?block=10%2C0%2C0&expected_shape=1%2C13%2C4096
  // State to keep track of plotting parameters
  const [zMin, setZMin] = useState(vMin);
  const [zMax, setZMax] = useState(vMax);
  const [autoZ, setAutoZ] = useState(true);
  const zRange = autoZ
    ? {}
    : {
        zmin: zMin,
        zmax: zMax,
      };

  const plotData: Data[] = [
    {
      z: frame as unknown as number[][],
      type: "heatmap",
      colorscale: "Viridis",
      ...zRange,
    },
  ];
  const title = "Title";
  const subtitle = "SUBTITLE";
  const xtext = "XLABEL";
  const ylabel = "YLABEL";

  return (
    <>
      <div>
        <Plot
          data={plotData}
          layout={{
            title: { text: title, subtitle: { text: subtitle } },
            xaxis: { title: { text: xtext } },
            yaxis: { title: { text: ylabel } },
          }}
          config={{
            editable: true,
          }}
        />
      </div>
      <div>Color: </div>
      <label className="label">
        <input
          type="checkbox"
          className="toggle"
          checked={autoZ}
          onChange={(e) => setAutoZ(e.currentTarget.checked)}
        />{" "}
        Auto
      </label>
      <RangePicker
        min={vMin}
        max={vMax}
        bottom={zMin}
        top={zMax}
        setBottom={setZMin}
        setTop={setZMax}
        disable={autoZ}
      />
    </>
  );
};

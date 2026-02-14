import { useState } from "react";
import type { ChangeEvent } from "react";
import type { PlotRelayoutEvent, Data, Shape } from "plotly.js";
import Plot from "react-plotly.js";

import { COLORS } from "./colors";
import type { TypedArray } from "../tiled/types";
import type { ROI, ROIUpdate } from "./types";

const colorCycle = [...Object.values(COLORS)];

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
            max={max - 1}
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
          min={min}
          max={max - 1}
          onChange={updateRange("bottom")}
        />
      </div>
      <div className="flex space-x-1">
        <label className="label">
          Max:
          <input
            type="range"
            className="range"
            min={min + 1}
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
          min={min + 1}
          max={max}
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
          min={min}
          max={max}
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
          min={1}
          max={max - min}
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
  rois,
  updateRoi,
}: {
  frame: TypedArray[];
  vMin: number;
  vMax: number;
  rois: ROI[];
  updateRoi: (index: number, update: ROIUpdate) => void;
}) => {
  // const [rois, onChangeROIs] = useState([
  //   {
  //     x0: 50,
  //     y0: 50,
  //     x1: 100,
  //     y1: 100,
  //   },
  //   {
  //     x0: 150,
  //     y0: 150,
  //     x1: 200,
  //     y1: 200,
  //   },
  // ]);
  // E.g. /api/v1/array/block/04d28613-b2c4-4b5c-ba31-6aff5c49922d/streams/primary/ge_13element?block=10%2C0%2C0&expected_shape=1%2C13%2C4096
  // State to keep track of plotting parameters
  const [zMin, setZMin] = useState<number | null>(null);
  const [zMax, setZMax] = useState<number | null>(null);
  const [zMin_, zMax_] = [zMin ?? vMin, zMax ?? vMax];
  const [autoZ, setAutoZ] = useState(true);

  const zRange = autoZ
    ? {}
    : {
        zmin: zMin_,
        zmax: zMax_,
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

  const updateROIs = (update: PlotRelayoutEvent) => {
    // Build a list of indexes and parameters to update
    const updates: { [key: string]: ROIUpdate } = {};
    Object.entries(update).map(([key, value]) => {
      const match = key.match(/shapes\[(\d+)\]\.([xy][0-9]+)/);
      if (match != null) {
        const [, index, roiKey] = match as [string, string, keyof ROIUpdate];
        const update: ROIUpdate = updates[index] || (updates[index] = {});
        update[roiKey] = value;
      }
    });
    // Apply the updated ROI parameters
    Object.entries(updates).map(([index, update]) => {
      updateRoi(Number(index), update);
    });
  };

  const roiShapes = rois.map((roi, index): Shape => {
    const color = colorCycle[index % colorCycle.length];
    return {
      type: "rect",
      layer: "above",
      path: "",
      xsizemode: "scaled",
      xanchor: "auto",
      ysizemode: "scaled",
      yanchor: "auto",
      name: "",
      templateitemname: "",
      showlegend: false,
      legendgroup: "",
      legendgrouptitle: { text: "" },
      legendrank: 1000,
      xref: "x",
      yref: "y",
      x0: roi.x0,
      y0: roi.y0,
      x1: roi.x1,
      y1: roi.y1,
      fillcolor: roi.isActive ? "#d3d3d350" : "#d3d3d300",
      opacity: roi.isActive ? 1 : 0.15,
      line: {
        color: color,
      },
      label: {
        text: roi.name,
        font: {
          color: roi.isActive ? color : `${color}40`,
        },
        textposition: "top left",
      },
      visible: index > 0,
    };
  });

  return (
    <>
      <div>
        <Plot
          data={plotData}
          layout={{
            title: { text: title, subtitle: { text: subtitle } },
            xaxis: { title: { text: xtext } },
            yaxis: { title: { text: ylabel } },
            uirevision: "true",
            shapes: roiShapes,
          }}
          config={{
            editable: true,
          }}
          onRelayout={updateROIs}
        />
      </div>

      <div
        tabIndex={0}
        className="collapse collapse-arrow bg-base-100 border-base-300 border"
      >
        <input type="checkbox" />
        <div className="collapse-title font-semibold">Colors</div>
        <div className="collapse-content text-sm">
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
            bottom={zMin_}
            top={zMax_}
            setBottom={setZMin}
            setTop={setZMax}
            disable={autoZ}
          />
        </div>
      </div>
    </>
  );
};

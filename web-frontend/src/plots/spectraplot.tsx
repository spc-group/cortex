import type { PlotRelayoutEvent, Data, Shape } from "plotly.js";
import Plot from "react-plotly.js";

import { COLORS } from "./colors";
import type { TypedArray } from "../tiled/types";
import type { ROI, ROIUpdate } from "./types";

const colorCycle = [...Object.values(COLORS)];

// Show a set of spectra in a plot.
export const SpectraPlot = ({
  frame,
  binSize,
  xlabel,
  rois,
  updateRoi,
}: {
  frame: TypedArray[];
  binSize: number;
  xlabel: string;
  rois: ROI[];
  updateRoi: (index: number, update: ROIUpdate) => void;
}) => {
  // E.g. /api/v1/array/block/04d28613-b2c4-4b5c-ba31-6aff5c49922d/streams/primary/ge_13element?block=10%2C0%2C0&expected_shape=1%2C13%2C4096
  // State to keep track of plotting parameters
  const plotData: Data[] = frame.map((line) => {
    const xs = [...Array(line.length).keys()].map((bin) => binSize * bin);
    return {
      x: [...xs],
      y: line as unknown as number[],
      type: "scatter",
      mode: "lines",
    };
  });
  const title = "Title";
  const subtitle = "SUBTITLE";
  const xtext = xlabel;
  const ylabel = "Counts";

  // Build resizable regions for ROI selection
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
      yref: "paper",
      x0: roi.x0 * binSize,
      y0: 0,
      // Only "Total" will have x1 == null, but we need a default for type checking
      x1: (roi.x1 ?? 1) * binSize,
      y1: 1,
      fillcolor: color,
      opacity: roi.isActive ? 0.15 : 0.05,
      line: {
        width: 0,
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

  const updateROIs = (update: PlotRelayoutEvent) => {
    // Build a list of indexes and parameters to update
    const updates: { [key: string]: ROIUpdate } = {};
    Object.entries(update).map(([key, value]) => {
      const match = key.match(/shapes\[(\d+)\]\.([x][0-9]+)/);
      if (match != null) {
        const [, index, roiKey] = match as [string, string, keyof ROIUpdate];
        const update: ROIUpdate = updates[index] || (updates[index] = {});
        // @ts-expect-error: Type 'number is not assignable to type 'undefined'
        update[roiKey] = value / binSize;
      }
    });
    // Apply the updated ROI parameters
    Object.entries(updates).map(([index, update]) => {
      updateRoi(Number(index), update);
    });
  };

  return (
    <>
      <div>
        <Plot
          data={plotData}
          layout={{
            title: { text: title, subtitle: { text: subtitle } },
            uirevision: "true",
            xaxis: { title: { text: xtext } },
            yaxis: { title: { text: ylabel } },
            shapes: roiShapes,
          }}
          config={{
            editable: true,
          }}
          onRelayout={updateROIs}
        />
      </div>
    </>
  );
};

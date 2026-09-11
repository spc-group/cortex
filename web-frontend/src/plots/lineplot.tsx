import type { Data } from "plotly.js";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import Plot from "react-plotly.js";
import unpack from "ndarray-unpack";

import type { LineData } from "./types";
import { COLORS } from "./colors";

const colorCycle = [...Object.values(COLORS)];

export const LinePlot = ({
  data,
  title,
  subtitle,
  xlabel,
  ylabel,
  activePoint,
}: {
  data: LineData[];
  title?: string;
  subtitle?: string;
  xlabel?: string;
  ylabel?: string;
  activePoint?: number;
}) => {
  const plotData = data.map(({ x: xdata, y: ydata, name, color }, index) => {
    let color_;
    if (color != null) {
      // Chec if we have a specific color sequence (e.g. "c3")
      const colorMatch = color.match(/[cC](\d+)/);
      if (colorMatch) {
        color_ = colorCycle[Number(colorMatch[1])];
      } else {
        color_ = color;
      }
    } else {
      color_ = colorCycle[index];
    }
    if (ydata == null) {
      return null;
    }
    const colors = Array(ydata.shape[0]).fill(color_);
    const symbols = Array(ydata.shape[0]).fill("circle");
    if (activePoint != null) {
      colors[activePoint] = COLORS["tab:red"];
      symbols[activePoint] = "cross";
    }
    const ds: Data = {
      x: xdata == null ? undefined : unpack(xdata).map((v) => Number(v)),
      y: ydata == null ? undefined : unpack(ydata).map((v) => Number(v)),
      name: name,
      type: "scatter",
      mode: "lines+markers",
      line: { color: color_, dash: "dot" },
      marker: { color: colors, symbol: symbols },
    };
    return ds;
  });

  const xtext = xlabel === "---" ? "Index" : xlabel;
  // Show an error if no data are available
  if (plotData.length === 0) {
    return (
      <div role="alert" className="m-2 alert alert-error alert-soft">
        <span>
          <ExclamationTriangleIcon className="size-4 inline" /> No plottable
          data are available.
        </span>
      </div>
    );
  }
  return (
    // Responsive layout taken from:
    // https://dev.to/dheerajmurali/building-a-responsive-chart-in-react-with-plotly-js-4on8
    <>
      <Plot
        data={plotData.filter((ds) => ds != null)}
        layout={{
          title: { text: title, subtitle: { text: subtitle } },
          xaxis: { title: { text: xtext } },
          yaxis: { title: { text: ylabel } },
          uirevision: "true",
          autosize: true,
        }}
        useResizeHandler
        className="w-full md:aspect-3/2 sm:aspect-square"
        config={{
          editable: true,
          /* responsive: true, */
        }}
      />
    </>
  );
};

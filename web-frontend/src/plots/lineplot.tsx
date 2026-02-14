import type { Data } from "plotly.js";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import Plot from "react-plotly.js";

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
  // http://localhost:8000/api/v1/table/partition/9e2ac83f-da86-4acd-9a20-26f8263aecf9%2Fstreams%2Fprimary%2Finternal?partition=0&column=sim_motor_2&column=ts_sim_motor_2
  // https://github.com/bluesky/tiled-viewer-react/blob/eabb0d63a00a31a0630c4cabd1ec35ae5e66ea16/src/components/Tiled/apiClient.ts#L258
  const plotData = data.map(({ x: xdata, y: ydata, name, color }, index) => {
    let color_;
    if (color != null) {
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
    const colors = Array(ydata.length).fill(color_);
    const symbols = Array(ydata.length).fill("circle");
    if (activePoint != null) {
      colors[activePoint] = COLORS["tab:red"];
      symbols[activePoint] = "cross";
    }
    const ds: Data = {
      x: xdata ?? undefined,
      y: ydata,
      name: name,
      type: "scatter",
      mode: "lines+markers",
      line: { color: color_ },
      marker: { color: colors, symbol: symbols },
    };
    return ds;
    // if (xdata != null) {
    //   ds.x = xdata;
    // }
    // plotData.push(ds);
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
    <>
      <Plot
        data={plotData.filter((ds) => ds != null)}
        layout={{
          title: { text: title, subtitle: { text: subtitle } },
          xaxis: { title: { text: xtext } },
          yaxis: { title: { text: ylabel } },
          uirevision: "true",
          /* autosize: true, */
        }}
        config={{
          editable: true,
          /* responsive: true, */
        }}
      />
    </>
  );
};

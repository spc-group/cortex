import type { Data } from "plotly.js";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import Plot from "react-plotly.js";

import { COLORS } from "./colors";

export const LinePlot = ({
  xdata,
  ydata,
  title,
  subtitle,
  xlabel,
  ylabel,
  activePoint,
}: {
  xdata: number[] | null;
  ydata: number[] | null;
  title?: string;
  subtitle?: string;
  xlabel?: string;
  ylabel?: string;
  activePoint?: number;
}) => {
  // http://localhost:8000/api/v1/table/partition/9e2ac83f-da86-4acd-9a20-26f8263aecf9%2Fstreams%2Fprimary%2Finternal?partition=0&column=sim_motor_2&column=ts_sim_motor_2
  // https://github.com/bluesky/tiled-viewer-react/blob/eabb0d63a00a31a0630c4cabd1ec35ae5e66ea16/src/components/Tiled/apiClient.ts#L258
  const plotData: Data[] = [];
  if (ydata != null) {
    const colors = Array(ydata.length).fill(COLORS["tab:blue"]);
    const symbols = Array(ydata.length).fill("circle");
    if (activePoint != null) {
      colors[activePoint] = COLORS["tab:red"];
      symbols[activePoint] = "cross";
    }
    const ds: Data = {
      y: ydata,
      type: "scatter",
      mode: "lines+markers",
      marker: { color: colors, symbol: symbols },
    };
    if (xdata != null) {
      ds.x = xdata;
    }
    plotData.push(ds);
  }

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
        data={plotData}
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

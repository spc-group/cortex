import type { Data } from "plotly.js";
import Plot from "react-plotly.js";

export const LinePlot = ({
  xdata,
  ydata,
  uid,
  title,
  xlabel,
  ylabel,
}: {
  xdata: number[];
  ydata: number[];
  uid: string;
  title?: string;
  xlabel?: string;
  ylabel?: string;
}) => {
  // http://localhost:8000/api/v1/table/partition/9e2ac83f-da86-4acd-9a20-26f8263aecf9%2Fstreams%2Fprimary%2Finternal?partition=0&column=sim_motor_2&column=ts_sim_motor_2
  // https://github.com/bluesky/tiled-viewer-react/blob/eabb0d63a00a31a0630c4cabd1ec35ae5e66ea16/src/components/Tiled/apiClient.ts#L258
  const plotData: Data[] = [];
  if (xdata !== undefined && ydata !== undefined) {
    plotData.push({
      x: xdata,
      y: ydata,
      type: "scatter",
      mode: "lines+markers",
      marker: { color: "red" },
    });
  }

  return (
    <>
      <Plot
        data={plotData}
        layout={{
          title: { text: title, subtitle: { text: uid } },
          xaxis: { title: { text: xlabel } },
          yaxis: { title: { text: ylabel } },
        }}
        config={{
          editable: true,
        }}
      />
    </>
  );
};

import type { Data } from "plotly.js";
import Plot from "react-plotly.js";

export const FramePlot = ({ frame }: { frame: number[][] }) => {
  // E.g. /api/v1/array/block/04d28613-b2c4-4b5c-ba31-6aff5c49922d/streams/primary/ge_13element?block=10%2C0%2C0&expected_shape=1%2C13%2C4096
  const plotData: Data[] = [
    {
      z: frame?.[0],
      type: "heatmap",
      colorscale: "Viridis",
      zmin: 0,
      zmax: 12,
    },
  ];
  const title = "Title";
  const subtitle = "SUBTITLE";
  const xtext = "XLABEL";
  const ylabel = "YBALEBL";

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
    </>
  );
};

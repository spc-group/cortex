import type { Data } from "plotly.js";
import { useState } from "react";
import Plot from "react-plotly.js";

import { useFrame } from "../tiled";

export const FramePlot = ({ path }: { path: string }) => {
  // E.g. /api/v1/array/block/04d28613-b2c4-4b5c-ba31-6aff5c49922d/streams/primary/ge_13element?block=10%2C0%2C0&expected_shape=1%2C13%2C4096
  const [activeFrame, setActiveFrame] = useState(0);
  const { array } = useFrame(path, activeFrame);
  const plotData: Data[] = [
    {
      z: array,
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
      <label className="input">
        <span className="label">Current frame:</span>
        <span>{activeFrame}</span>
        <input
          type="range"
          min={0}
          max={200}
          value={activeFrame}
          onChange={(e) => {
            setActiveFrame(Number(e.target.value));
          }}
          className="range"
          step="1"
        />
      </label>
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
    </>
  );
};

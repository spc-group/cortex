import type { Data } from "plotly.js";
import Plot from "react-plotly.js";

import type { TypedArray } from "../tiled/types";

// Show a set of spectra in a plot.
export const SpectraPlot = ({
  frame,
  evPerBin,
}: {
  frame: TypedArray[];
  evPerBin: number;
}) => {
  // E.g. /api/v1/array/block/04d28613-b2c4-4b5c-ba31-6aff5c49922d/streams/primary/ge_13element?block=10%2C0%2C0&expected_shape=1%2C13%2C4096
  // State to keep track of plotting parameters
  const plotData: Data[] = frame.map((line) => {
    const xs = [...Array(line.length).keys()].map((bin) => evPerBin * bin);
    return {
      x: [...xs],
      y: line as unknown as number[],
      type: "scatter",
      mode: "lines",
    };
  });
  const title = "Title";
  const subtitle = "SUBTITLE";
  const xtext = "Energy /eV";
  const ylabel = "Counts";

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
          }}
          config={{
            editable: true,
          }}
        />
      </div>
    </>
  );
};

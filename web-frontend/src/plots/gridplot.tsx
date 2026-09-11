import Plot from "react-plotly.js";
import type { Data } from "plotly.js";
import ndarray from "ndarray";
import type { NdArray } from "ndarray";
import unpack from "ndarray-unpack";

/** Create a linearly-spaced ndarray.
 *
 * @param start - The first item of the array.
 * @param stop - The last item of the array.
 * @param num - The total number of items in the array, including
 *start* and *stop*.
 */
const linSpace = (start: number, stop: number, num: number) => {
  const step = (stop - start) / num;
  const data = Array.from(
    { length: (stop - start) / step + 1 },
    (_, index) => start + index * step,
  );
  return ndarray(data, [num]);
};

export const GridPlot = (options: {
  data: NdArray;
  shape: number[];
  extents: number[][];
  title: string;
  subtitle: string;
  xlabel: string;
  ylabel: string;
}) => {
  const { data, shape, extents, title, subtitle, xlabel, ylabel } = options;
  const [[y0, y1], [x0, x1]] = extents;
  const [ny, nx] = shape;
  const xs = linSpace(x0, x1, nx);
  const ys = linSpace(y0, y1, ny);
  const plotData: Data[] = [
    {
      x: unpack(xs),
      y: unpack(ys),
      z: unpack(data),
      type: "heatmap",
      colorscale: "Viridis",
    },
  ];
  return (
    <>
      <Plot
        data={plotData}
        layout={{
          autosize: true,
          title: { text: title, subtitle: { text: subtitle } },
          xaxis: { title: { text: xlabel } },
          yaxis: { title: { text: ylabel }, scaleanchor: "x" },
        }}
        className={`w-full`}
        useResizeHandler
        config={{
          editable: true,
        }}
      />
    </>
  );
};

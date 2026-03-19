import type { ROI } from "../plots";
import type { DataKey, Stream, DataSource } from "./types";

// Create a list of signal sources from corresponding stream data keys
// @param dataKeys - Stream data keys for all possible signals
// @param hints - If provided, only dataKeys present in `hints` will
//   be returned.
export const signalSources = (
  dataKeys: { [key: string]: DataKey },
  hints: string[] | null,
  rois: { [key: string]: ROI[] } = {},
  stream: Stream,
) => {
  const dataEntries = Object.entries(dataKeys);
  const signalEntries = dataEntries
    .filter(([name]) => {
      // Filter data keys that aren't hinted (maybe)
      return hints != null ? hints.includes(name) : true;
    })
    .map(([name, key]) => {
      // Decide on the path based on stream and metadata
      const ancestors = [...stream.ancestors, stream.key];
      if (key?.external == null) {
        ancestors.push("internal");
      }
      // Build the source object
      return [
        name,
        {
          path: [...ancestors, name].join("/"),
          dataKey: dataKeys[name],
          name,
        },
      ];
    });
  const signalSources = Object.fromEntries(signalEntries);
  // Add sources for the ROI's of arrays
  const oldRoiEntries = Object.entries(rois)
    // Only include ROIs for signals that are available in this stream
    .filter(([signalName]) => Object.keys(signalSources).includes(signalName));
  const roiEntries = oldRoiEntries.reduce(
    (previousValue: [string, DataSource][], [signalName, sigRois]) => {
      const newRois = sigRois.map((roi: ROI): [string, DataSource] => {
        const roiName = `${signalName} (${roi.name})`;
        return [roiName, { ...signalSources[signalName], roi, name: roiName }];
      });
      return [...previousValue, ...newRois];
    },
    [],
  );
  // Combine all the different sources
  const allSources = Object.fromEntries([...signalEntries, ...roiEntries]);
  return allSources;
};

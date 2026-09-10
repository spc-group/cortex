import type { ROI } from "../plots";
import type { DataKey, Stream, DataSource } from "./types";

/**
 * Create a list of signal sources from corresponding stream data keys
 * @param dataKeys - Stream data keys for all possible signals
 * @param hints - If provided, only dataKeys present in `hints` will
 *   be returned.
 */
export const signalSources = (
  dataKeys: { [key: string]: DataKey },
  hints: string[] | null,
  rois: { [key: string]: ROI[] } = {},
  stream: Stream,
): { [key: string]: DataSource } => {
  // Add generic sources that don't have data keys
  const extraKeys: { [key: string]: DataKey } = {
    time: {
      dtype: "number",
      shape: [],
    },
    seq_num: {
      dtype: "number",
      shape: [],
    },
  };
  const dataEntries = Object.entries({ ...extraKeys, ...dataKeys });
  const signalEntries = dataEntries
    .filter(([name]) => {
      // Filter data keys that aren't hinted (maybe)
      return hints != null ? hints.includes(name) : true;
    })
    .map(([name, key]) => {
      // Decide on the path based on stream and metadata
      let ancestors = [...stream.ancestors, stream.key];
      let timestampName: string;
      const isExternal = key?.external != null;
      if (!isExternal) ancestors.push("internal");
      if (isExternal || name === "time" || name === "seq_num") {
        timestampName = "time";
      } else {
        timestampName = `ts_${name}`;
      }
      ancestors = ancestors.filter((ancestor) => ancestor != null);
      // Build the source object
      return [
        name,
        {
          path: [...ancestors, name].join("/"),
          timestampPath: [...ancestors, timestampName].join("/"),
          dataKey: key,
          name,
        },
      ];
    });
  const signalSources: { [key: string]: DataSource } =
    Object.fromEntries(signalEntries);
  const signalPaths = Object.values(signalSources).map((source) => source.path);
  // Add sources for the ROI's of arrays
  const oldRoiEntries = Object.entries(rois)
    // Only include ROIs for signals that are available in this stream
    .filter(([signalName]) => signalPaths.includes(signalName));
  const roiEntries = oldRoiEntries.reduce(
    (
      previousValue: [string, DataSource][],
      [signalPath, sigRois]: [string, ROI[]],
    ) => {
      const newRois = sigRois.map((roi: ROI, index): [string, DataSource] => {
        const roiName = roi.name == "" ? `rois[${index}]` : `${roi.name}`;
        const signalName = signalPath.split("/").at(-1) as string;
        const sigName = `${signalName} – ${roiName}`;
        return [sigName, { ...signalSources[signalName], roi, name: sigName }];
      });
      return [...previousValue, ...newRois];
    },
    [],
  );
  // Combine all the different sources
  const allSources = Object.fromEntries([...signalEntries, ...roiEntries]);
  return allSources;
};

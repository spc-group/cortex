// Create a list of signal names from corresponding stream data keys
// @param dataKeys - Stream data keys for all possible signals
// @param hints - If provided, only dataKeys present in `hints` will
//   be returned.
export const signalNames = (
  dataKeys: { [key: string]: unknown },
  hints?: string[] | null,
) => {
  let signalNames: string[];
  signalNames = Object.keys(dataKeys);
  if (hints != null) {
    signalNames = signalNames.filter((key) => hints.includes(key));
  }
  signalNames.sort();
  return signalNames;
};

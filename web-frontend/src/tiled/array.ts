import { useEffect, useRef, useReducer } from "react";
import type { AxiosInstance } from "axios";
import { useQuery } from "@tanstack/react-query";
import type { ReadyState } from "react-use-websocket";

import { useMetadata } from "./metadata";
import { useTiledWebSocket } from "./streaming";
import { v1Client } from "./tiled_api";
import type {
  ArrayStructure,
  WebSocketArray,
  DataType,
  TypedArray,
  TypedArrayConstructor,
  Stats,
} from "./types";
import type { ROI } from "../plots";

// Hit the API over HTTP to get a given array slice
// @param path - The Tiled URI path for this array
// @param sliceNum - The index of the slice to retrieve.
// @returns - A 2D matrix of the data for this slice.
export const getArraySlice = async (
  path: string,
  sliceNum: number,
  ArrayClass: TypedArrayConstructor,
  { client }: { client?: AxiosInstance } = {},
): Promise<TypedArray> => {
  const client_ = client ?? v1Client;
  const response = await client_.get(`array/full/${path}`, {
    params: { slice: sliceNum, format: "application/octet-stream" },
    responseType: "arraybuffer",
  });
  const buff = new ArrayClass(response.data);
  return buff;
};

// Retrieve multiple slices in parallel over HTTP GET
export const getArray = async (
  path: string,
  slices: number[],
  ArrayClass: TypedArrayConstructor,
  { client }: { client?: AxiosInstance } = {},
) => {
  const promises = slices.map((slice) =>
    getArraySlice(path, slice, ArrayClass, { client }),
  );
  return await Promise.all(promises);
};

const dtypeToArray = (dtype: DataType) => {
  const klass = {
    // '[kind, size]': ArrayClass
    '["u",1]': Uint8Array,
    '["u",2]': Uint16Array,
    '["u",4]': Uint32Array,
    '["u",8]': BigUint64Array,
    '["i",1]': Int8Array,
    '["i",2]': Int16Array,
    '["i",4]': Int32Array,
    '["i",8]': BigInt64Array,
    '["f",2]': Float16Array,
    '["f",4]': Float32Array,
    '["f",8]': Float64Array,
  }[JSON.stringify([dtype.kind, dtype.itemsize])];
  if (klass == null) {
    if (dtype.itemsize !== 0) {
      console.log(JSON.stringify([dtype.kind, dtype.itemsize]));
      console.error(`Could not pick an array type for ${dtype}.`);
    }
    return Uint8Array;
  }

  return klass;
};

// A hook that provides slices from a given array.
// @param path - The URL path to the array of interest on Tiled
// @param slices - Array of slice indices to retrieve from the
//   server. If `null` (default), then retrieve all slices.
export const useArray = (
  path: string,
  slices: number[] | null = null,
): {
  array: TypedArray[][] | null;
  isLoading: boolean;
  readyState: ReadyState;
  shape: number[];
  dataType: DataType;
} => {
  // Get array information via HTTP request
  const shapeRef = useRef<number[]>([]);
  const { metadata, isLoading: isLoadingMetadata } = useMetadata<
    object,
    ArrayStructure
  >(path);
  let dataType: DataType;
  if (isLoadingMetadata || metadata == null) {
    dataType = {
      endianness: "",
      kind: "",
      itemsize: 0,
      dt_units: null,
    };
  } else {
    const structure = metadata.attributes.structure;
    dataType = structure.data_type;
    // Only update the shape if it hasn't been initialized yet
    if (shapeRef.current.length === 0) {
      shapeRef.current = structure.shape;
    }
  }
  // Get the full array if *slices* is not explicitly given
  let realSlices: number[];
  if (slices === null) {
    realSlices = [...Array(shapeRef?.current[0] ?? 0).keys()];
  } else {
    realSlices = slices;
  }
  // Get the past data with a regular HTTP GET request
  const ArrayClass = dtypeToArray(dataType);
  const { isLoading: isLoadingData, data: buffers } = useQuery<TypedArray[]>({
    queryFn: async () => {
      return await getArray(path, realSlices, ArrayClass);
    },
    queryKey: ["array", path, ...realSlices, ArrayClass],
  });
  // Watch for shape updates via websockets
  const { payload, readyState } = useTiledWebSocket<WebSocketArray>(path);
  if (
    ["array-ref", "array-data"].includes(payload?.type ?? "") &&
    payload != null
  ) {
    shapeRef.current = payload.data_source.structure.shape;
  }
  // Reshape the buffer arrays to match the expected shape
  const array =
    buffers != null ? reshapeArray(buffers, shapeRef.current) : null;

  return {
    array,
    isLoading: isLoadingData || isLoadingMetadata,
    readyState,
    shape: shapeRef.current,
    dataType,
  };
};

// Reshape the buffer arrays to match the expected shape
const reshapeArray = (
  buffers: TypedArray[],
  shape: number[],
): TypedArray[][] | null => {
  if (buffers == null) {
    return null;
  }
  return buffers.map((buff) => {
    const [nRows, nCols] = [shape[1], shape[2]];
    return [...Array(nRows).keys()].map((row) => {
      return buff.slice(row * nCols, (row + 1) * nCols);
    });
  });
};

// Hook that is similar to useArray but just returns statistics of an array
export const useArrayStats = (
  path: string,
  rois: ROI[],
  { client }: { client?: AxiosInstance } = {},
): { stats: Stats[]; isLoading: boolean; readyState: ReadyState } => {
  const [arrayStats, dispatch] = useReducer(reduceArrayStats, []);
  // Need a string to keep track of when the actual ROI bounds themselves change
  const roiString = JSON.stringify(
    rois.map((roi) => [roi.x0, roi.x1, roi.y0, roi.y1]).flat(),
  );
  const arrayRoiString = JSON.stringify(
    arrayStats.map(({ roi }) => [roi.x0, roi.x1, roi.y0, roi.y1]).flat(),
  );
  // Update the stats to make the new shape of the array
  const { isLoading, readyState, shape, dataType } = useArray(path, []);
  // Clear the stats if major changes are coming
  useEffect(() => {
    dispatch({
      type: "clear_stats",
      shape: [],
      data: new Uint8Array(),
      rois: rois,
      index: 0,
    });
  }, [path, rois]);
  // Reset each set of stats if the ROI changes
  useEffect(() => {
    dispatch({
      type: "reset_rois",
      shape: [],
      data: new Uint8Array(),
      rois: rois,
      index: 0,
    });
  }, [rois, roiString]);
  // Update the shape of the stats data when needed
  useEffect(() => {
    dispatch({
      type: "update_shape",
      shape: shape,
      data: new Uint8Array(),
      rois: rois,
      index: 0,
    });
  }, [path, rois, shape]);
  // A simple lock to make sure we don't get the same array multiple times
  const pendingArrays = useRef<number[]>([]);

  // Update the stats for each slices
  const ArrayClass = dtypeToArray(dataType);
  // path, shape, rois, arrayRoiString, client, ArrayClass, arrayStats
  // useEffect(() => console.log("Changed"), [arrayStats])
  useEffect(() => {
    // Calculate stats for new slices
    const getArrays = async () => {
      const checkArray = async (slice: number) => {
        const oldStats = arrayStats.map((stats) => {
          // Check if any of the stats for this slice are missing
          return !stats.roi.isActive
            ? []
            : [
                stats.sum?.[slice] ?? null,
                stats.max?.[slice] ?? null,
                stats.min?.[slice] ?? null,
              ];
        });
        if (
          shape.length === 3 &&
          oldStats.flat().includes(null) &&
          !pendingArrays.current.includes(slice)
        ) {
          // We need to get a fresh copy of this array to do stats
          pendingArrays.current.push(slice); // Acquire lock
          // console.log(`Loading slice ${slice}`);
          // console.log(myObj);
          const data = await getArraySlice(path, slice, ArrayClass, {
            client: client,
          });
          const action = {
            type: "add_slice",
            data: data,
            index: slice,
            shape: shape,
            rois: rois,
          };
          dispatch(action);
          // Remove the lock
          const index = pendingArrays.current.indexOf(slice);
          if (index > -1) {
            // only splice array when item is found
            pendingArrays.current.splice(index, 1); // 2nd parameter means remove one item only
          }
        }
      };
      const slices = [...Array(shape[0]).keys()];
      // Sequential execution
      // for (const prom of slices.map(checkArray)) {
      // 	await prom;
      // }
      // Concurrent execution
      await Promise.all(slices.map(checkArray));
    };
    getArrays().catch(console.error);
  }, [path, shape, rois, arrayRoiString, client, ArrayClass, arrayStats]);
  return {
    isLoading: isLoading,
    readyState: readyState,
    stats: arrayStats,
  };
};

const compareROIs = (a: ROI, b: ROI) => {
  return a.x0 === b.x0 && a.x1 === b.x1 && a.y0 === b.y0 && a.y1 === b.y1;
};

export const reduceArrayStats = (
  oldStats: Stats[],
  action: {
    type: string;
    shape: number[];
    data: TypedArray;
    index: number;
    rois: ROI[];
  },
) => {
  switch (action.type) {
    case "clear_stats": {
      // Reset the accumulated stats so we can start calculating over again
      return action.rois.map((roi) => {
        return {
          sum: [],
          max: [],
          min: [],
          shape: [],
          roi: roi,
        };
      });
      break;
    }
    case "reset_rois": {
      // Reset the stats just for ROIs that have changed
      return action.rois.map((roi, i) => {
        const roisAreEqual =
          oldStats.length <= i ? false : compareROIs(oldStats[i].roi, roi);
        if (roisAreEqual) {
          return oldStats[i];
        } else {
          return {
            sum: [],
            max: [],
            min: [],
            shape: [],
            roi: roi,
          };
        }
      });
      break;
    }
    case "update_shape": {
      const newShape = action.shape;
      // Extend the stats arrays up to the new shape
      const newLength = action.shape[0];
      const extendArray = (oldArray: (number | null)[]) => {
        const oldLength = (oldArray ?? []).length;
        if (newLength > oldLength) {
          return [
            ...(oldArray ?? []),
            ...Array(newLength - oldLength).fill(null),
          ];
        } else {
          return oldArray;
        }
      };
      return oldStats.map((oldStat) => {
        return {
          shape: newShape,
          sum: extendArray(oldStat.sum),
          max: extendArray(oldStat.max),
          min: extendArray(oldStat.min),
          roi: oldStat.roi,
        };
      });
      break;
    }
    case "add_slice": {
      // const t0 = performance.now();
      return action.rois.map((roi, index) => {
        if (!roi.isActive) {
          return oldStats[index];
        }
        // Figure out how to crop the 1D typed array to the desired ROI
        const { x0, x1, y0, y1 } = roi;
        const x0_ = Math.floor(x0);
        const x1_ = Math.min(Math.ceil(x1 ?? Infinity), action.shape[2] - 1);
        const y0_ = Math.floor(y0);
        const y1_ = Math.min(Math.ceil(y1 ?? Infinity), action.shape[1] - 1);
        const data = action.data;
        const rows = [...Array(y1_ + 1).keys()].slice(y0_);
        const nCols = action.shape[2];
        const segments = rows.map((yi): [number, number] => [
          nCols * yi + x0_,
          nCols * yi + x1_ + 1,
        ]);
        // Calculate stats for the new cropped array
        const cumulative = segments.reduce(
          (
            stats: { sum: number; min: number; max: number },
            segment: [number, number],
          ) => {
            const slc = data.slice(segment[0], segment[1]);
            return (slc as unknown as number[]).reduce(
              (
                stats: { sum: number; min: number; max: number },
                value: number,
              ) => {
                return {
                  sum: stats.sum + value,
                  min: value < stats.min ? value : stats.min,
                  max: value > stats.max ? value : stats.max,
                };
              },
              stats,
            );
          },
          { sum: 0, max: -Infinity, min: Infinity },
        );
        // Merge the stats for this slice in with the other stats
        const { sum: newSum, min: newMin, max: newMax } = cumulative;
        // console.log(`Math took ${performance.now() - t0} milliseconds`);
        const newStats = {
          sum: [
            ...oldStats[index].sum.slice(0, action.index),
            newSum,
            ...oldStats[index].sum.slice(action.index + 1),
          ],
          max: [
            ...oldStats[index].max.slice(0, action.index),
            newMax,
            ...oldStats[index].max.slice(action.index + 1),
          ],
          min: [
            ...oldStats[index].min.slice(0, action.index),
            newMin,
            ...oldStats[index].min.slice(action.index + 1),
          ],
          shape: oldStats[index].shape,
          roi: oldStats[index].roi,
        };
        return newStats;
      });
      break;
    }
    default: {
      return oldStats;
    }
  }
};

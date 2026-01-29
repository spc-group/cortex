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
} from "./types";

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

interface Stats {
  sum: (number | null)[];
  max: (number | null)[];
  min: (number | null)[];
  shape: number[];
}

interface StatsResult extends Stats {
  isLoading: boolean;
  readyState: ReadyState;
}

// Hook that is similar to useArray but just returns statistics of an array
export const useArrayStats = (
  path: string,
  { client }: { client?: AxiosInstance } = {},
): StatsResult => {
  const [arrayStats, dispatch] = useReducer(reduceArrayStats, {
    sum: [],
    min: [],
    max: [],
    shape: [],
  });
  // Update the stats to make the new shape of the array
  const { isLoading, readyState, shape, dataType } = useArray(path, []);
  if (shape !== arrayStats.shape) {
    dispatch({
      type: "update_shape",
      shape: shape,
      data: new Uint8Array(),
      index: 0,
    });
  }

  // A simple lock to make sure we don't get the same array multiple times
  const pendingArrays = useRef<number[]>([]);

  // Update the stats for each slices
  const ArrayClass = dtypeToArray(dataType);
  useEffect(() => {
    const getArrays = async () => {
      const checkArray = async (slice: number) => {
        const oldStats = [
          arrayStats.sum?.[slice],
          arrayStats.max?.[slice],
          arrayStats.min?.[slice],
        ];
        if (oldStats.includes(null) && !pendingArrays.current.includes(slice)) {
          // We need to get a fresh copy of this array to do stats
          pendingArrays.current.push(slice); // Acquire lock
          const data = await getArraySlice(path, slice, ArrayClass, {
            client: client,
          });
          const action = {
            type: "add_slice",
            data: data,
            index: slice,
            shape: [],
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
      const slices = [...Array(arrayStats.shape[0]).keys()];
      // Sequential execution
      // for (const prom of slices.map(checkArray)) {
      // 	await prom;
      // }
      // Concurrent execution
      await Promise.all(slices.map(checkArray));
    };
    getArrays().catch(console.error);
  }, [
    path,
    shape,
    arrayStats.sum,
    arrayStats.max,
    arrayStats.min,
    arrayStats.shape,
    client,
    ArrayClass,
  ]);
  return {
    isLoading: isLoading,
    readyState: readyState,
    ...arrayStats,
  };
};

export const reduceArrayStats = (
  oldStats: Stats,
  action: { type: string; shape: number[]; data: TypedArray; index: number },
) => {
  switch (action.type) {
    case "update_shape": {
      const newShape =
        action.shape === oldStats.shape ? oldStats.shape : action.shape;
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
      return {
        shape: newShape,
        sum: extendArray(oldStats.sum),
        max: extendArray(oldStats.max),
        min: extendArray(oldStats.min),
      };
      break;
    }
    case "add_slice": {
      // const t0 = performance.now();
      const data = action.data;
      const cumulative = (data as unknown as number[]).reduce(
        (stats: { sum: number; min: number; max: number }, value: number) => {
          return {
            sum: stats.sum + value,
            min: value < stats.min ? value : stats.min,
            max: value > stats.max ? value : stats.max,
          };
        },
        { sum: 0, max: -Infinity, min: Infinity },
      );
      const { sum: newSum, min: newMin, max: newMax } = cumulative;
      // console.log(`Math took ${performance.now() - t0} milliseconds`);
      const newStats = {
        sum: [
          ...oldStats.sum.slice(0, action.index),
          newSum,
          ...oldStats.sum.slice(action.index + 1),
        ],
        max: [
          ...oldStats.max.slice(0, action.index),
          newMax,
          ...oldStats.max.slice(action.index + 1),
        ],
        min: [
          ...oldStats.min.slice(0, action.index),
          newMin,
          ...oldStats.min.slice(action.index + 1),
        ],
        shape: oldStats.shape,
      };
      return newStats;
      break;
    }
  }
  return oldStats;
};

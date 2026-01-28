import { useEffect, useRef, useReducer } from "react";
import type { AxiosInstance } from "axios";
import { useQuery } from "@tanstack/react-query";
import type { ReadyState } from "react-use-websocket";

import { useMetadata } from "./metadata";
import { useTiledWebSocket } from "./streaming";
import { v1Client } from "./tiled_api";
import type { ArrayStructure, WebSocketArray } from "./types";

// Hit the API over HTTP to get a given array slice
// @param path - The Tiled URI path for this array
// @param sliceNum - The index of the slice to retrieve.
// @returns - A 2D matrix of the data for this slice.
export const getArraySlice = async (
  path: string,
  sliceNum: number,
  { client }: { client?: AxiosInstance } = {},
) => {
  const client_ = client ?? v1Client;
  const response = await client_.get(`array/full/${path}`, {
    params: { slice: sliceNum, format: "application/json" },
    // responseType: "arraybuffer",
  });
  return response.data;
};

// Retrieve multiple slices in parallel over HTTP GET
export const getArray = async (
  path: string,
  slices: number[],
  { client }: { client?: AxiosInstance } = {},
) => {
  const promises = slices.map((slice) =>
    getArraySlice(path, slice, { client }),
  );
  return await Promise.all(promises);
};

// A hook that provides slices from a given array.
// @param path - The URL path to the array of interest on Tiled
// @param slices - Array of slice indices to retrieve from the
//   server. If `null` (default), then retrieve all slices.
export const useArray = (
  path: string,
  slices: number[] | null = null,
): {
  array: number[][] | null;
  isLoading: boolean;
  readyState: ReadyState;
  shape: number[];
  endianness: string;
  kind: string;
  itemsize: number;
} => {
  // Get array information via HTTP request
  const shapeRef = useRef<number[]>([]);
  const { metadata, isLoading: isLoadingMetadata } = useMetadata<
    object,
    ArrayStructure
  >(path);
  let endianness: string, kind: string, itemsize: number;
  if (isLoadingMetadata || metadata == null) {
    endianness = "";
    kind = "";
    itemsize = 0;
  } else {
    const structure = metadata.attributes.structure;
    endianness = structure.data_type.endianness;
    kind = structure.data_type.kind;
    itemsize = structure.data_type.itemsize;
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
  const { isLoading: isLoadingData, data: array } = useQuery<number[][]>({
    queryFn: async () => {
      return await getArray(path, realSlices);
    },
    queryKey: ["array", path, ...realSlices],
  });
  // Watch for shape updates via websockets
  const { payload, readyState } = useTiledWebSocket<WebSocketArray>(path);
  if (
    ["array-ref", "array-data"].includes(payload?.type ?? "") &&
    payload != null
  ) {
    shapeRef.current = payload.data_source.structure.shape;
  }
  return {
    array: array ?? null,
    isLoading: isLoadingData || isLoadingMetadata,
    readyState,
    shape: shapeRef.current,
    endianness: endianness,
    kind: kind,
    itemsize: itemsize,
  };
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
  const { isLoading, readyState, shape } = useArray(path, []);
  if (shape !== arrayStats.shape) {
    dispatch({ type: "update_shape", shape: shape, data: [], index: 0 });
  }

  // A simple lock to make sure we don't get the same array multiple times
  const pendingArrays = useRef<number[]>([]);

  // Update the stats for each slices
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
          const data = await getArraySlice(path, slice, { client: client });
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
  ]);
  return {
    isLoading: isLoading,
    readyState: readyState,
    ...arrayStats,
  };
};

export const reduceArrayStats = (
  oldStats: Stats,
  action: { type: string; shape: number[]; data: number[][]; index: number },
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
      const data = action.data.flat();
      const newSum = data.reduce(
        (sum: number, value: number) => sum + value,
        0,
      );
      const newMin = data.reduce((min: number, value: number) =>
        value < min ? value : min,
      );
      const newMax = data.reduce((max: number, value: number) =>
        value > max ? value : max,
      );
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

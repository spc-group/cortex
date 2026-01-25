import { useRef } from "react";
import type { AxiosInstance } from "axios";
import { useQuery } from "@tanstack/react-query";

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
export const useArray = (path: string, slices: number[] | null = null) => {
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
  const { isLoading: isLoadingData, data: array } = useQuery({
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
    array,
    isLoading: isLoadingData || isLoadingMetadata,
    readyState,
    shape: shapeRef.current,
    endianness: endianness,
    kind: kind,
    itemsize: itemsize,
  };
};

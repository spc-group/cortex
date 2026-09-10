import * as zarr from "zarrita";
import * as ndzarr from "@zarrita/ndarray";
import ndarray from "ndarray";
import { useState, useEffect, useContext } from "react";

import { useMetadata } from "./metadata";
import { useTiledWebSocket } from "./streaming";
import { ZarrRootContext } from "./context";
import type { ArrayStructure, ZArray, WebSocketMessage } from "./types";

interface WebSocketArray extends WebSocketMessage {
  shape: number[];
}

export const useArrayZ = (path: string) => {
  const [zArr, setZArray] = useState<ZArray | undefined>(undefined);
  const root = useContext(ZarrRootContext);
  if (root == null) {
    throw new Error(
      "A component using useArrayZ() must be wrapped in a TiledProvider",
    );
  }
  // Use the shape to listen for new frames
  const { metadata } = useMetadata<object, ArrayStructure>(path);
  const { payload } = useTiledWebSocket<WebSocketArray>(path);
  let shape: number[] | undefined;
  if (payload?.type === "array-ref") {
    // Use the shape from the latest websocket update
    shape = payload.shape;
  } else {
    // Use the shape from HTTP metadata
    shape = metadata?.attributes.structure.shape;
  }
  const shapeString = JSON.stringify(shape);
  // Load the metadata for the array
  useEffect(() => {
    const getArray = async () => {
      const loc = root.resolve(path);
      const zarray = await zarr.open.v3(loc);
      setZArray(zarray as ZArray);
    };
    getArray().catch(console.error);
  }, [path, shapeString, root]);
  return { arr: zArr, shape, streamingState: 1 };
};

/**
 * Load some or all of the data for a zarr array
 * @param path - The API location of the array
 * @param slice - Which subset of the data to get.
 */
export const useArrayData = (
  path: string,
  slice?: number | zarr.Slice | null,
) => {
  const { arr: zArr } = useArrayZ(path);
  const [arrData, setArrData] = useState<ndarray.NdArray | undefined>(
    undefined,
  );
  // Load the data from the array
  useEffect(() => {
    const getData = async () => {
      // Guard against errors where things aren't loaded yet
      if (zArr == null) return;
      if (zArr.shape[0] === 0) return;
      // Check for a database/API race condition
      const outOfBounds =
        typeof slice === "number" ? slice >= zArr?.shape[0] : false;
      if (outOfBounds) return;
      // Update the array data from the API
      const slc = slice == null ? null : [slice, null, null];
      const arrData = await ndzarr.get(zArr, slc);
      setArrData(arrData as ndarray.NdArray);
    };
    getData().catch(console.error);
  }, [zArr, slice]);
  return arrData;
};

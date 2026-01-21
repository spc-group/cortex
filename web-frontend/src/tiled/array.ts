// import { useReducer, useRef } from "react";
// import { Table } from "apache-arrow";
import { useQuery } from "@tanstack/react-query";

// import type { Stream, WebSocketNode } from "../types";
// import type { WebSocketNode } from "../types";
// import { useTiledWebSocket } from "./streaming.ts";
import { v1Client as client } from "./tiled_api";

// interface WebSocketArray extends WebSocketNode {
//   append: boolean;
//   payload: Table;
// }

// Hit the API over HTTP to get a given array slice
// @param path - The Tiled URI path for this array
// @param sliceNum - The index of the slice to retrieve.
// @returns - A 2D matrix of the data for this slice.
export const getArraySlice = async (path: string, sliceNum: number) => {
  // http://localhost:8000/api/v1/array/full/6852bbf9-34fc-4612-ad21-7d10bc9b137e/primary/bdet?format=image/png&slice=10
  const response = await client.get(`array/full/${path}`, {
    params: { slice: sliceNum },
  });
  return response.data;
};

// type TableUpdate = {
//   type: string;
//   sequence?: number;
//   timestamp?: string;
//   mimetype?: string;
//   partition?: number;
//   append: boolean;
//   payload: Table;
// };

// // Update the running data table with new data
// // @param table - The original table to be modified
// // @param action - Describes the update to be performed.
// // @returns - The update table, possible the original table that was
// //   passed in if no update is warranted.
// //
// // If `action.type` is "table-data", then a different table will be
// // returned than was passed in. If `action.append` is true, the new
// // table will be a concatenation of the original `table` and the new data in
// // `action.payload`. Otherwise, the table in payload will be returned.
// export const updateTableData = (table: Table, action: TableUpdate) => {
//   if (action?.type !== "table-data") {
//     // Guard against updates that don't modify the table
//     return table;
//   }
//   if (table == null) {
//     return action.payload;
//   }
//   if (action.append) {
//     return table.concat(action.payload);
//   }
//   return action.payload;
// };

// A hook that provides a given slice from a given array.
// @param path - The URL path to the array of interest on Tiled
export const useFrame = (path: string, frameNum: number) => {
  // Keep track of which datasets we've seen already
  // const sequenceNumbers = useRef<number[]>([]);
  // Get the past data with a regular HTTP GET request
  const { isLoading, data: array } = useQuery({
    queryFn: async () => {
      return await getArraySlice(path, frameNum);
    },
    queryKey: ["array", path, frameNum],
  });
  // // Watch for updates via websocket
  // const [table, dispatch] = useReducer(updateTableData, new Table());
  // const wsUrl = [...stream.ancestors, stream.key, "internal"].join("/");
  // const { payload, readyState } = useTiledWebSocket<WebSocketTable>(wsUrl);
  // // Update the running table based on most recent responses
  // const hasNewHttpData =
  //   !sequenceNumbers.current.includes(-1) && httpData != null;
  // const hasNewWsData =
  //   payload != null && !sequenceNumbers.current.includes(payload?.sequence);
  // if (hasNewHttpData) {
  //   sequenceNumbers.current = [-1, ...sequenceNumbers.current];
  //   dispatch({ type: "table-data", payload: httpData, append: false });
  // } else if (hasNewWsData) {
  //   sequenceNumbers.current = [payload.sequence, ...sequenceNumbers.current];
  //   dispatch(payload);
  // }
  const readyState = 1;

  return { array, isLoading, readyState };
};

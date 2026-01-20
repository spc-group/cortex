import { useReducer, useRef } from "react";
import { Table } from "apache-arrow";
import { useQuery } from "@tanstack/react-query";

import type { Stream, WebSocketNode } from "../types";
import { useTiledWebSocket } from "./streaming.ts";
import { getTableData } from "./tiled_api";

interface WebSocketTable extends WebSocketNode {
  append: boolean;
  payload: Table;
}

type TableUpdate = {
  type: string;
  sequence?: number;
  timestamp?: string;
  mimetype?: string;
  partition?: number;
  append: boolean;
  payload: Table;
};

// Update the running data table with new data
// @param table - The original table to be modified
// @param action - Describes the update to be performed.
// @returns - The update table, possible the original table that was
//   passed in if no update is warranted.
//
// If `action.type` is "table-data", then a different table will be
// returned than was passed in. If `action.append` is true, the new
// table will be a concatenation of the original `table` and the new data in
// `action.payload`. Otherwise, the table in payload will be returned.
export const updateTableData = (table: Table, action: TableUpdate) => {
  if (action?.type !== "table-data") {
    // Guard against updates that don't modify the table
    return table;
  }
  if (table == null) {
    return action.payload;
  }
  if (action.append) {
    return table.concat(action.payload);
  }
  return action.payload;
};

// A hook that provides the latest data from a given stream.
// @param stream - The run stream that contains the data of interest
export const useDataTable = (stream: Stream) => {
  // Keep track of which datasets we've seen already
  const sequenceNumbers = useRef<number[]>([]);
  // Get the past data with a regular HTTP GET request
  const path = [...stream.ancestors, stream.key].join("/");
  const { isLoading, data: httpData } = useQuery({
    queryFn: async () => {
      const response = await getTableData(path);
      return response;
    },
    queryKey: ["table", stream.uid],
  });
  // Watch for updates via websocket
  const [table, dispatch] = useReducer(updateTableData, new Table());
  const wsUrl = [...stream.ancestors, stream.key, "internal"].join("/");
  const { payload, readyState } = useTiledWebSocket<WebSocketTable>(wsUrl);
  // Update the running table based on most recent responses
  const hasNewHttpData =
    !sequenceNumbers.current.includes(-1) && httpData != null;
  const hasNewWsData =
    payload != null && !sequenceNumbers.current.includes(payload?.sequence);
  if (hasNewHttpData) {
    sequenceNumbers.current = [-1, ...sequenceNumbers.current];
    dispatch({ type: "table-data", payload: httpData, append: false });
  } else if (hasNewWsData) {
    sequenceNumbers.current = [payload.sequence, ...sequenceNumbers.current];
    dispatch(payload);
  }

  return { table, isLoading, readyState };
};

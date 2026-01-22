import { useQuery } from "@tanstack/react-query";

import { v1Client as client } from "./tiled_api";

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

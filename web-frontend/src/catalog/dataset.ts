import * as zarr from "zarrita";
import * as ndzarr from "@zarrita/ndarray";
import { backOff } from "exponential-backoff";
import ndarray from "ndarray";
import { sum } from "ndarray-ops";
import type { ReadyState } from "react-use-websocket";
import { useState, useEffect, useContext } from "react";

import type { ZArray } from "../tiled";
import { WebSocketContext, decodeMsgPack, ZarrRootContext } from "../tiled";
import type { DataSource } from "./types";

// Semaphore locking mechanism. Returns function to request a lock.
// Calling `requestLock("my-key")` returns a release function that can
// be called later once the lock is to be released. If the lock is not
// availabe, `requestLock` returns false.
const useSemaphore = (maxCount: number) => {
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());

  const request = (key?: string) => {
    if (key == null) {
      throw new Error("UNDEF");
    }
    // Get an open lock slot if avaiable
    if (pendingKeys.size >= maxCount || pendingKeys.has(key)) {
      return false;
    }
    // Apply the locks
    setPendingKeys((prev) => {
      return new Set([...prev, key]);
    });
    // Return a releasing function
    return () => {
      setPendingKeys((prev) => {
        const newSet = new Set([...prev]);
        newSet.delete(key);
        return newSet;
      });
    };
  };
  return {
    lockCount: pendingKeys.size,
    requestLock: request,
  };
};

// Determine where to subscribe for updates to the dataset
function webSocketUrl(root: string, source: DataSource) {
  const pathParts = source.path.split("/");
  let subPath = pathParts;
  // Check for paths that are part of an internal table
  if (pathParts[pathParts.length - 2] === "internal") {
    subPath = pathParts.slice(0, pathParts.length - 1);
  }
  return [root, ...subPath].join("/");
}

// A hook that looks up multiple sets of plotting data and packages it
// into a consumable format.
export const useDatasets = (sources: {
  [key: string]: DataSource;
}): {
  datasets: { [key: string]: ndarray.NdArray };
  isLoading: boolean;
  isStreaming: boolean;
  readyState?: ReadyState;
  error?: Error;
} => {
  const root = useContext(ZarrRootContext);
  const wsRoot = useContext(WebSocketContext);
  const maxTasks = 6;
  const { requestLock, lockCount: taskCount } = useSemaphore(maxTasks);
  const [datasets, setDatasets] = useState<{ [key: string]: ndarray.NdArray }>(
    {},
  );
  const [sockets, setSockets] = useState<{ [key: string]: WebSocket }>({});
  const [zarrays, setZarrays] = useState<{ [key: string]: ZArray | undefined }>(
    {},
  );
  const [error, setError] = useState<Error | undefined>(undefined);
  // Make sure we have zarr array definitions for each dataset
  useEffect(() => {
    if (error) {
      return;
    }
    // Asynchronous inner function to do the network I/O
    const getArray = async (name: string, source: DataSource) => {
      let arr;
      if (root == null) {
        const err = new Error(
          "TiledProvider is not configured correctly. No zarr root.",
        );
        setError(err);
        return;
      }
      try {
        arr = await backOff(() => zarr.open.v3(root.resolve(source.path)));
      } catch (err) {
        setError(err as Error);
        return;
      }
      if (arr instanceof zarr.Array) {
        // Stash the new zarr array object for later use
        setZarrays((prev) => {
          return { ...prev, [name]: arr };
        });
        // Initialize empty array for this zarray
        setDatasets((prev) => {
          if (!Object.keys(prev).includes(name)) {
            return { ...prev, [name]: ndarray([], [arr.shape[0]]) };
          } else {
            return prev;
          }
        });
      } else {
        throw new Error(`${source.path} is not a zarr Array`);
      }
      // Set up websockets for tracking new data
      const wsUrl = webSocketUrl(wsRoot, source);
      let socket = sockets?.[name];
      if (socket == null) {
        // Set up a new websocket for this data set
        socket = new WebSocket(`${wsUrl}?envelope_format=msgpack`);
        setSockets((prevSockets) => {
          return { ...prevSockets, [name]: socket };
        });
        socket.addEventListener("message", (event) => {
          decodeMsgPack(event.data)
            .then((msg) => {
              if (msg?.type === "array-ref" || msg?.type === "table-data") {
                // Remove the cached zarray so it will get re-fetched
                setZarrays((prev) => {
                  return { ...prev, [name]: undefined };
                });
              }
            })
            .catch((err) => console.log(err));
        });
      }
    };
    // Don't try to get more data if something is not working
    for (const [name, source] of Object.entries(sources)) {
      // Guard against getting the data multpile times
      if (zarrays?.[name] != null) {
        return;
      }
      // Load the array from the network
      const releaseLock = requestLock(`array-${name}`);
      if (releaseLock) {
        // Lock acquired
        getArray(name, source).finally(releaseLock);
      }
    }
  }, [sources, zarrays, taskCount, requestLock, root, error, sockets, wsRoot]);
  // Load array data through zarr
  useEffect(() => {
    for (const [name] of Object.entries(sources)) {
      // Get the (possibly filled with nulls) dataset
      const ds = datasets?.[name];
      const zarray = zarrays?.[name];
      // First decide if there's anything to do
      if (ds == null) {
        continue;
      }
      if (zarray == null) {
        continue;
      }
      if (ds.data.length === zarray.shape[0]) {
        continue;
      }
      // Decide which slices to get
      const nDims = zarray.shape.length;
      let start, stop;
      if (zarray.shape.length === 1) {
        // 1-dimensional array, get the whole array at once
        start = 0;
        stop = zarray.shape[0];
      } else {
        // Multi-dimensional array, break into pieces and reduce
        const blockSize = 20;
        start = ds.data.length;
        stop = Math.min(ds.data.length + blockSize, zarray.shape[0]);
      }
      const extraDims = new Array(nDims - 1).fill(null);
      // Check to make sure we're not sending duplicate requests
      const sliceKey = `slice-${name}-${start}-${stop}`;
      const releaseLock = requestLock(sliceKey);
      if (!releaseLock) {
        continue;
      }
      // Asynchronous inner function to get the next block
      const getSlice = async () => {
        const doGet = () =>
          ndzarr.get(zarray, [zarr.slice(start, stop), ...extraDims]);
        let result;
        try {
          result = await backOff(() => doGet());
        } catch (err) {
          console.error(err);
          setError(err as Error);
          return;
        }
        // Reduce dimensions for multi-dimension arrays
        setDatasets((prevDatasets) => {
          const ds = prevDatasets[name];
          let newDataset;
          if (
            result.dimension === 1 &&
            JSON.stringify(result.shape) === JSON.stringify(zarray.shape)
          ) {
            // A full result, so just replace the array wholesale
            newDataset = result.lo(0) as ndarray.NdArray;
            // newDataset = ndarray(
            //   result.data,
            //   result.shape,
            //   result.stride,
            //   result.offset,
            // );
          } else {
            // Update the rolling results array for each of the slices
            newDataset = ds.lo(0); // Need a new object to return to react
            newDataset = ndarray(
              ds.data,
              [zarray.shape[0]],
              ds.stride,
              ds.offset,
            );
            for (let i = 0; i < stop - start; i++) {
              const sliceData = result.lo(i).hi(1) as ndarray.NdArray;
              const sliceSum = sum(sliceData);
              newDataset.set(i + start, sliceSum);
            }
          }
          return { ...prevDatasets, [name]: newDataset };
        });
      };
      getSlice().finally(releaseLock);
    }
  }, [sources, zarrays, datasets, taskCount, requestLock]);
  // Determine an overall ready state based on all the sockets
  const readyStates = Object.values(sockets).map((sock) => sock.readyState);
  const isStreaming = readyStates.reduce(
    (acc, state) => acc && state === WebSocket.OPEN,
    readyStates.length > 0,
  );
  const readyState =
    readyStates.length >= 0 ? Math.max(...readyStates) : undefined;
  return {
    datasets,
    isLoading: taskCount > 0,
    isStreaming: isStreaming,
    readyState,
    error,
  };
};

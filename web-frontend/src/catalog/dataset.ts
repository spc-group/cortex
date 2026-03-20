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
import type { ROI } from "../plots";

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
  const maxTasks = 12;
  const { requestLock, lockCount: taskCount } = useSemaphore(maxTasks);
  const [datasets, setDatasets] = useState<{ [key: string]: ndarray.NdArray }>(
    {},
  );
  const [rois, setRois] = useState<{ [key: string]: ROI }>({});
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
          return { ...prev, [source.path]: arr };
        });
      } else {
        throw new Error(`${source.path} is not a zarr Array`);
      }
      // Clear out any old data
      setDatasets((prev) => {
        if (!Object.keys(prev).includes(name)) {
          return { ...prev, [name]: ndarray([], [arr.shape[0]]) };
        } else {
          return prev;
        }
      });
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
            .catch((err) => console.error(err));
        });
      }
    };
    // Don't try to get more data if something is not working
    for (const [name, source] of Object.entries(sources)) {
      // Guard against getting the data multpile times
      if (zarrays?.[source.path] != null) {
        continue;
      }
      // Load the array from the network
      const releaseLock = requestLock(`array-${source.path}`);
      if (releaseLock) {
        // Lock acquired
        getArray(name, source).finally(releaseLock);
      }
    }
  }, [sources, zarrays, taskCount, requestLock, root, error, sockets, wsRoot]);
  // Set up empty arrays
  useEffect(() => {
    for (const [name, source] of Object.entries(sources)) {
      const arr = zarrays?.[source.path];
      const hasArray = arr != null;
      const hasDataset = Object.keys(datasets).includes(name);
      if (hasArray && !hasDataset) {
        setDatasets((prev) => {
          return { ...prev, [name]: ndarray([], [arr.shape[0]]) };
        });
      }
    }
  }, [sources, zarrays, datasets]);
  // Clear out arrays if the ROI limits have changed
  useEffect(() => {
    const toRoiString = (roi: ROI): string => {
      const [x0, x1, y0, y1] = [
        roi.x0 == null ? "null" : Math.floor(roi.x0),
        roi.x1 == null ? "null" : Math.ceil(roi.x1),
        roi.y0 == null ? "null" : Math.floor(roi.y0),
        roi.y1 == null ? "null" : Math.ceil(roi.y1),
      ];
      return `${x0}-${x1}-${y0}-${y1}`;
    };
    // Check each source for updates 1-by-1
    const newRois: { [key: string]: ROI } = {};
    for (const [name, source] of Object.entries(sources)) {
      if (source?.roi == null) {
        continue;
      }
      // Check for changes to the ROI bounds
      const oldRoiString =
        rois?.[name] == null ? undefined : toRoiString(rois[name]);
      const arr = zarrays?.[source.path];
      if (arr == null) {
        continue;
      }
      if (toRoiString(source.roi) !== oldRoiString) {
        setDatasets((prev) => {
          // Erase the existing dataset
          return { ...prev, [name]: ndarray([], [arr.shape[0]]) };
        });
        newRois[name] = source.roi;
      }
    }
    // Update the saved ROIs if anything has changed
    if (Object.keys(newRois).length > 0) {
      setRois(newRois);
    }
  }, [sources, zarrays, rois]);
  // Load array data through zarr
  useEffect(() => {
    for (const [name, source] of Object.entries(sources)) {
      // Sort out the details of the ROI
      const roi = source?.roi;
      const arrayName = source.path;
      const datasetName = name;
      // Get the (possibly filled with nulls) dataset
      const ds = datasets?.[datasetName];
      const zarray = zarrays?.[source.path];
      // First decide if there's anything to do
      if (zarray == null) {
        continue;
      }
      if (ds == null) {
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
      let extraDims;
      if (roi != null) {
        const normalize = (value: number | null) => {
          const roundValue = value == null ? null : Math.floor(value);
          // Helper function to ensure the value is in-bounds
          const isInBounds = roundValue == null ? false : 0 <= roundValue;
          return isInBounds ? roundValue : null;
        };
        const [x0, x1, y0, y1] = [
          normalize(roi.x0),
          normalize(roi.x1),
          normalize(roi.y0),
          normalize(roi.y1),
        ];
        extraDims = [zarr.slice(y0, y1), zarr.slice(x0, x1)];
      } else {
        extraDims = new Array(nDims - 1).fill(null);
      }
      // Check to make sure we're not sending duplicate requests
      const sliceKey = `slice-${arrayName}-${start}-${stop}`;
      const releaseLock = requestLock(sliceKey);
      if (!releaseLock) {
        continue;
      }
      // Asynchronous inner function to get the next block
      const getSlice = async () => {
        const doGet = () => {
          return ndzarr.get(zarray, [zarr.slice(start, stop), ...extraDims]);
        };
        let result;
        try {
          result = await backOff(() => doGet());
        } catch (err) {
          console.error(err);
          throw err;
          setError(err as Error);
          return;
        }
        // Reduce dimensions for multi-dimension arrays
        setDatasets((prevDatasets) => {
          const ds = prevDatasets[datasetName];
          let newDataset;
          if (
            result.dimension === 1 &&
            JSON.stringify(result.shape) === JSON.stringify(zarray.shape)
          ) {
            // A full result, so just replace the array wholesale
            newDataset = result.lo(0) as ndarray.NdArray;
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
          return { ...prevDatasets, [datasetName]: newDataset };
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
  // Actual datasets
  return {
    datasets: datasets,
    isLoading: taskCount > 0,
    isStreaming: isStreaming,
    readyState,
    error,
  };
};

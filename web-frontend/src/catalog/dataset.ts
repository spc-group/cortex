import * as zarr from "zarrita";
import * as ndzarr from "@zarrita/ndarray";
import ndarray from "ndarray";
import { sum } from "ndarray-ops";
import { useState, useEffect, useRef } from "react";

import type { ZarrRoot, ZArray } from "../tiled";
import type { DataSource } from "./types";

// Semaphore locking mechanism. Returns two functions, request and
// release. request can be used to *request* the lock. If the lock is
// available, this function returns true, otherwise it returns false.
const useSemaphore = (maxCount: number) => {
  const [currentValue, setCurrentValue] = useState<number>(maxCount);
  const request = () => {
    // Get an open lock slot if avaiable
    if (currentValue > 0) {
      setCurrentValue((prev) => prev - 1);
      return true;
    }
    return false;
  };
  const release = () => {
    setCurrentValue((prev) => prev + 1);
  };
  return {
    lockCount: maxCount - currentValue,
    requestLock: request,
    releaseLock: release,
  };
};

// A hook that looks up multiple sets of plotting data and packages it
// into a consumable format.
export const useDatasets = (
  sources: { [key: string]: DataSource },
  options?: { zarrRoot?: ZarrRoot },
): {
  datasets: { [key: string]: ndarray.NdArray };
  isLoading: boolean;
  isStreaming: boolean;
} => {
  const root =
    options?.zarrRoot ??
    zarr.root(new zarr.FetchStore("http://localhost:8000/zarr/v3"));
  const maxTasks = 6;
  const {
    releaseLock,
    requestLock,
    lockCount: taskCount,
  } = useSemaphore(maxTasks);
  const [datasets, setDatasets] = useState<{ [key: string]: ndarray.NdArray }>(
    {},
  );
  // const [pendingSources, setPendingSources] = useState<Source[]>([]);
  const pendingSlices = useRef<Set<string>>(new Set());
  const [zarrays, setZarrays] = useState<{ [key: string]: ZArray }>({});
  const pendingArrays = useRef<Set<string>>(new Set());
  // Make sure we have zarr array definitions for each dataset
  useEffect(() => {
    for (const [name, source] of Object.entries(sources)) {
      // Guard against getting the data multpile times
      if (pendingArrays.current.has(name)) {
        continue;
      } else {
        pendingArrays.current.add(name);
      }
      // Load the array from the network
      if (!requestLock()) {
        continue;
      }
      zarr.open
        .v3(root.resolve(source.path))
        .then((arr) => {
          if (arr instanceof zarr.Array) {
            // Stash the new zarr array object for later use
            setZarrays((prev) => {
              return { ...prev, [name]: arr };
            });
            // Initialize empty array for this zarray
            setDatasets((prev) => {
              return { ...prev, [name]: ndarray([], [arr.shape[0]]) };
            });
          } else {
            throw new Error(`${source.path} is not a zarr Array`);
          }
        })
        .catch((err) => {
          console.error(err);
          // // If the fetch failed, remove the pending marker from the cached arrays
          // setZarrays(
          //   Object.fromEntries(
          //     Object.entries(zarrays).filter(([thisName]) => thisName !== name),
          //   ),
          // );
        })
        .finally(() => {
          releaseLock();
        });
    }
  }, [sources, zarrays, releaseLock, requestLock, root]);
  // Load array data through zarr
  useEffect(() => {
    for (const [name] of Object.entries(sources)) {
      // Get the (possibly filled with nulls) dataset
      const ds = datasets?.[name];
      const zarray = zarrays[name];
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
      // Check to make sure we're not sending duplicate requests
      const sliceKey = `${name}-${start}`;
      if (pendingSlices.current.has(sliceKey)) {
        continue;
      } else {
        pendingSlices.current.add(sliceKey);
      }
      // Get the next block
      const extraDims = new Array(nDims - 1).fill(null);
      if (!requestLock()) {
        continue;
      }
      ndzarr
        .get(zarray, [zarr.slice(start, stop), ...extraDims])
        .then(
          // @ts-expect-error: This can be unknown[] for some reason?
          (result: ndarray.NdArray) => {
            // Reduce dimensions for multi-dimension arrays
            setDatasets((prevDatasets) => {
              const ds = prevDatasets[name];
              let newDataset;
              if (JSON.stringify(result.shape) === JSON.stringify(ds.shape)) {
                newDataset = ndarray(
                  result.data,
                  result.shape,
                  result.stride,
                  result.offset,
                );
              } else {
                for (let i = 0; i < stop - start; i++) {
                  const sliceData = result.lo(i).hi(1) as ndarray.NdArray;
                  const sliceSum = sum(sliceData);
                  ds.set(i + start, sliceSum);
                }
                newDataset = ndarray(ds.data, ds.shape, ds.stride, ds.offset);
              }
              return { ...prevDatasets, [name]: newDataset };
            });
          },
        )
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          releaseLock();
          pendingSlices.current.delete(sliceKey);
        });
    }
  }, [sources, zarrays, datasets, releaseLock, requestLock]);
  return {
    datasets,
    isLoading: taskCount > 0,
    isStreaming: false,
  };
};

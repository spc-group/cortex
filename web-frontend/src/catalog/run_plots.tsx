import "katex/dist/katex.min.css";
import {
  ExclamationTriangleIcon,
  CircleStackIcon,
} from "@heroicons/react/24/solid";
import { useState, useRef } from "react";
import ndarray from "ndarray";
import type { NdArray } from "ndarray";

import { LinePlot, FramePlot, SpectraPlot, GridPlot } from "../plots";
import { prepareYData } from "./prepare_data";
import { LiveBadge } from "./live_badge";
import { useMetadata, useArrayZ, useArrayData } from "../tiled";
import { axisLabels } from "./axis_labels";
import type { Run, RunMetadata, DataSource, LineInfo } from "./types";
import type { ROI, ROIUpdate, LineData } from "../plots";
import { RoiTable } from "./roi_table";
import { useDatasets } from "./dataset";
import { useLocalStorage } from "@uidotdev/usehooks";
import { SingleRunPicker } from "./source_picker";

const LoadingBadge = () => {
  return (
    <div className="badge badge-soft badge-info s-3">
      <CircleStackIcon className="size-4 inline" />
      Loading…
    </div>
  );
};

interface GridDataset {
  data: NdArray;
  shape: number[];
  extents: number[][];
  xlabel: string;
  ylabel: string;
  title: string;
  subtitle: string;
  key: string;
}

/**
 * A component that shows all the plots for a given bluesky run.
 */
export const RunPlots = ({ run }: { run: Run }) => {
  const uid = run.uid;
  const [lineInfos, setLineInfos] = useState<LineInfo[]>([]);

  // ROIs let us crop area detector frames and plot their sum
  const [rois, setRois] = useLocalStorage<{ [key: string]: ROI[] }>(
    `rois-v1`,
    {},
  );
  const setFrameRois = (name: string) => {
    return (newRois: ROI[]) => {
      setRois({
        ...rois,
        [name]: newRois,
      });
      // Update line infos if they use these ROI's
      let newLineInfos: LineInfo[] = [];
      for (const newRoi of newRois) {
        /**
         * Helper to update the ROI for any one of the 3 axes.
         *
         * Returns a new lineinfo if the ROI is being used by the
         * given axis, otherwise it returns the original lineinfo
         * unmodified
         */
        const updatedLineInfo = (linfo: LineInfo, axis: "x" | "s" | "r") => {
          const usesThisRoi = linfo[axis]?.roi?.uid == newRoi.uid;
          if (usesThisRoi) {
            linfo = {
              // other axes and lineinfo params
              ...linfo,
              // This axis
              [axis]: {
                //
                ...(linfo?.[axis] ?? {}),
                ...newRoi,
              },
            };
          }
          return linfo;
        };

        newLineInfos = lineInfos.map((linfo) => {
          linfo = updatedLineInfo(linfo, "x");
          linfo = updatedLineInfo(linfo, "r");
          linfo = updatedLineInfo(linfo, "s");
          return linfo;
        });
      }
      setLineInfos(newLineInfos);
    };
  };

  // Retrieve metadata and data keys for this dataset
  const { metadata } = useMetadata<RunMetadata>(uid);

  /**
   * Come up with a unique ID for this dataset, including ROI
   */
  const sourceToID = (source: DataSource) => {
    let name = source.path;
    const roi = source?.roi;
    if (roi != null) {
      name = `${name}[${roi.y0}:${roi.y1},${roi.x0}:${roi.x1}]`;
    }
    return name;
  };

  const sources = Object.fromEntries(
    lineInfos
      .map((info: LineInfo) => {
        return [
          [info?.x != null ? sourceToID(info.x) : null, info.x],
          [info?.s != null ? sourceToID(info.s) : null, info.s],
          [info?.r != null ? sourceToID(info.r) : null, info.r],
        ];
      })
      .flat()
      .filter(([path]) => path != null),
  );
  // Get data from disk
  const {
    datasets,
    isLoading: isLoadingData,
    readyState,
    error,
  } = useDatasets(sources);
  let plotTitle: string;
  let plotSubtitle: string;
  if (uid === undefined) {
    return (
      <div role="alert" className="m-2 alert alert-error alert-soft">
        <span>
          <ExclamationTriangleIcon className="size-4 inline" /> No UID was
          provided.
        </span>
      </div>
    );
  } else if (metadata == null) {
    plotTitle = "";
    plotSubtitle = "";
  } else {
    const runMetadata: RunMetadata = metadata?.attributes?.metadata ?? {};
    plotTitle = `${runMetadata?.start?.sample_name} - ${runMetadata?.start?.scan_name}`;
    plotSubtitle = `${runMetadata?.start?.uid ?? ""}`;
  }

  const labels = axisLabels(lineInfos);

  // Re-package the data into lines
  const lineDatasets = lineInfos
    .map((info: LineInfo, i: number) => {
      if (info.s == null) return null;
      const xData = info.x != null ? datasets?.[sourceToID(info.x)] : null;
      const sData = info.s != null ? datasets?.[sourceToID(info.s)] : null;
      const rData = info.r != null ? datasets?.[sourceToID(info.r)] : null;
      return {
        x: xData?.values ?? null,
        y: prepareYData(xData, sData, rData, info?.operation ?? null, {
          inverted: info?.inverted ?? false,
          logarithm: info?.logarithm ?? false,
          gradient: info?.derivative ?? false,
        }),
        color: `c${i}`,
        name: `Row ${i}`,
      };
    })
    .filter((data) => data != null) as LineData[];
  // Re-package lines so we can plot arrays (i.e. area detector frames)
  const arraySources = lineInfos
    .map((info: LineInfo) => {
      return [info.x, info.s, info.r];
    })
    .flat()
    .filter((source) => {
      const dataShape = source?.dataKey?.shape ?? [];
      return dataShape.length === 3;
    }) as DataSource[];
  // Remove duplicates
  const sourcesByPath = Object.fromEntries(
    arraySources.map((source: DataSource) => [source.path, source]),
  );
  const uniqueArraySources = Object.values(sourcesByPath);
  // Prepare grid data if the scan was some sort of grid scan
  const gridShape = run.metadata.start?.shape ?? [];
  const isGrid = gridShape.length == 2;
  let gridDatasets: GridDataset[];
  if (isGrid) {
    gridDatasets = lineDatasets
      .filter((ds) => ds.y?.data != null)
      .map((ds, idx) => {
        return {
          data: ndarray(ds.y.data, gridShape),
          shape: gridShape,
          extents: run.metadata.start?.extents ?? [],
          xlabel: run.metadata.start?.motors?.[1] ?? "",
          ylabel: run.metadata.start?.motors?.[0] ?? "",
          title: plotTitle,
          subtitle: plotSubtitle,
          key: `${idx}`,
        };
      });
  } else {
    gridDatasets = [];
  }
  return (
    <div className="m-4">
      {/* New style signal picker */}
      <SingleRunPicker
        run={run}
        setLineInfos={setLineInfos}
        lineInfos={lineInfos}
        rois={rois}
      />
      <div className="m-2 space-x-2">
        <div className={"inline"}>
          <LiveBadge readyState={readyState} />
          {isLoadingData ? <LoadingBadge /> : <></>}
        </div>
      </div>
      <div className="lg:grid lg:grid-cols-2">
        {/* Optional plot is shown only when the scan is a rectilinear grid */}
        {gridDatasets.map((gridData) => (
          <GridPlot
            data={gridData.data}
            shape={gridData.shape}
            extents={gridData.extents}
            xlabel={gridData.xlabel}
            ylabel={gridData.ylabel}
            title={gridData.title}
            subtitle={gridData.subtitle}
            key={gridData.key}
          />
        ))}
        {/* Line plot data */}
        <div>
          {error != null ? (
            <div role="alert" className="m-2 alert alert-error alert-soft">
              <span>
                <ExclamationTriangleIcon className="size-4 inline" />
                The requested line data could not be retrieved.
              </span>
            </div>
          ) : (
            <></>
          )}
          <LinePlot
            data={lineDatasets}
            xlabel={labels.x}
            ylabel={labels.y}
            title={plotTitle}
            subtitle={plotSubtitle}
          />
        </div>
      </div>
      {uniqueArraySources.map((source) => {
        const frameRois = rois?.[source.path] ?? [];
        return (
          <div key={source.path}>
            <ArrayPlots
              source={source}
              /* evPerBin={evPerBin} */
              rois={frameRois}
              setRois={setFrameRois(source.path)}
            />
            <div
              tabIndex={0}
              className="collapse collapse-arrow bg-base-100 border-base-300 border"
            >
              <input type="checkbox" />
              <div className="collapse-title font-semibold">
                Regions of Interest (ROIs)
              </div>

              <div className="collapse-content text-sm">
                <RoiTable
                  rois={frameRois}
                  setRois={setFrameRois(source.path)}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Component that shows plots for a frame of an array.
 *
 * Will either show an image (heatmap) or individual spectra. If
 * spectra are shown, *evPerBin* determines the extent of the
 * horizontal axis.
 *
 * @param evPerBin - The energy width of each pixel in electron-volts.
 */
export function ArrayPlots({
  source,
  rois,
  setRois,
  evPerBin,
}: {
  source: DataSource;
  rois: ROI[];
  setRois: (rois: ROI[]) => void;
  evPerBin?: number;
}) {
  const arrayPath = source.path;
  const [activeFrame, setActiveFrame] = useState(0);
  const [autoFrame, setAutoFrame] = useState(true);
  const [viewMode, setViewMode] = useState<"frame" | "spectra">(
    evPerBin == null ? "frame" : "spectra",
  );

  const previousFrame = useRef<NdArray | null>(null);
  const isLoadingFrame = false;
  const { arr: zarray, streamingState } = useArrayZ(arrayPath);

  // Use the last frame if one has not been explicitely set
  const lastFrame = (zarray?.shape?.[0] ?? 1) - 1;
  if (autoFrame && activeFrame != lastFrame) {
    setActiveFrame(lastFrame);
  }
  const frame = useArrayData(arrayPath, activeFrame);

  if (frame != null) {
    previousFrame.current = frame;
  }
  // If there's nothing to plot, then just don't
  if (source == null) {
    return <div key={`${arrayPath}-empty`}></div>;
  }

  const imData = frame ?? previousFrame.current;
  // const vMin = reduceStat(stats, "min", Math.min, Infinity);
  const [vMin, vMax] = [0, 200];
  // Handle updating ROIs in a more global way
  const updateRoi = (index: number, update: ROIUpdate) => {
    setRois([
      ...rois.slice(0, index),
      {
        ...rois[index],
        ...update,
      },
      ...rois.slice(index + 1),
    ]);
  };
  // const vMax = reduceStat(stats, "max", Math.max, -Infinity);
  // Decide how to plot the individual frames
  let framePlot;
  if (imData != null && vMin != null && vMax != null) {
    if (viewMode === "spectra") {
      // Fluorescence spectra
      framePlot = (
        <>
          <SpectraPlot
            frame={imData}
            binSize={evPerBin ?? 1}
            xlabel={evPerBin != null ? "Energy /eV" : "Bin"}
            rois={rois}
            updateRoi={updateRoi}
            key={`${arrayPath}-spectra`}
          />
        </>
      );
    } else {
      // Some other area detector frame
      framePlot = (
        <>
          <FramePlot
            frame={imData}
            vMin={isNaN(vMin) ? 0 : vMin}
            vMax={isNaN(vMax) ? 1 : vMax}
            rois={rois}
            updateRoi={updateRoi}
            key={`${arrayPath}-frame`}
          />
        </>
      );
    }
  } else {
    // Data are not done loading yet
    framePlot = (
      <div
        key={`${arrayPath}-skeleton`}
        className="skeleton h-[457px] w-[700px]"
      ></div>
    );
  }
  return (
    <div>
      <h3>{source.name ?? source.path}</h3>
      <div>
        <label className="input w-130">
          <span className="label">Current frame</span>
          <span>{activeFrame}</span>
          <input
            type="range"
            min={0}
            max={lastFrame}
            value={activeFrame}
            onChange={(e) => {
              setAutoFrame(false);
              setActiveFrame(Number(e.target.value));
            }}
            className="range"
            step="1"
          />
          <span>{lastFrame}</span>
        </label>
        <label className="label px-2">
          <input
            type="checkbox"
            checked={viewMode === "spectra"}
            onChange={(e) => {
              setViewMode(e.currentTarget.checked ? "spectra" : "frame");
            }}
            className="toggle"
          />
          Spectra
        </label>
        <div className="m-2 inline">
          <LiveBadge readyState={streamingState} />
        </div>
        {isLoadingFrame ? <LoadingBadge /> : <></>}
        {framePlot}
      </div>
    </div>
  );
}

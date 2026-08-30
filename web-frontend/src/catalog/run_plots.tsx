import "katex/dist/katex.min.css";
// import { InlineMath } from "react-katex";
import {
  ExclamationTriangleIcon,
  CircleStackIcon,
} from "@heroicons/react/24/solid";
import { useState, useRef } from "react";
import type { NdArray } from "ndarray";

import { LinePlot, FramePlot, SpectraPlot } from "../plots";
import { prepareYData } from "./prepare_data";
import { LiveBadge } from "./live_badge";
import { useMetadata, useArrayZ, useArrayData } from "../tiled";
import { axisLabels } from "./axis_labels";
import type { Run, RunMetadata, DataSource, LineInfo } from "./types";
import type { ROI, ROIUpdate, LineData } from "../plots";
// import { RoiTable } from "./roi_table";
import { useDatasets } from "./dataset";
// import { useLocalStorage } from "@uidotdev/usehooks";
import { SingleRunPicker } from "./source_picker";

const LoadingBadge = () => {
  return (
    <div className="badge badge-soft badge-info s-3">
      <CircleStackIcon className="size-4 inline" />
      Loading…
    </div>
  );
};

export const RunPlots = ({ run }: { run: Run }) => {
  const uid = run.uid;
  const [lineInfos, setLineData] = useState<LineInfo[]>([]);
  // Retrieve metadata and data keys for this dataset
  const { metadata } = useMetadata<RunMetadata>(uid);
  // Get data from disk
  const sources = Object.fromEntries(
    lineInfos
      .map((info: LineInfo) => {
        return [
          [info.x?.path, info.x],
          [info.s?.path, info.s],
          [info.r?.path, info.r],
        ];
      })
      .flat()
      .filter(([path]) => path != null),
  );
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

  const updateRoi = (index: number, update: ROIUpdate) => {
    console.log("updateRoi", index, update);
  };

  // Re-package the data into lines
  const lineDatasets = lineInfos
    .map((info: LineInfo, i: number) => {
      if (info.s == null) return null;
      const xData = info.x != null ? datasets?.[info.x.path] : null;
      const sData = info.s != null ? datasets?.[info.s.path] : null;
      const rData = info.r != null ? datasets?.[info.r.path] : null;
      return {
        x: xData,
        y: prepareYData(sData, rData, info?.operation ?? null, {
          inverted: false,
          logarithm: false,
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
  return (
    <div className="m-4">
      {/* New style signal picker */}
      <SingleRunPicker
        run={run}
        setLineInfos={setLineData}
        lineInfos={lineInfos}
      />
      <div className="lg:grid lg:grid-cols-2">
        <div className="m-2 space-x-2">
          <div className={"inline"}>
            <LiveBadge readyState={readyState} />
            {isLoadingData ? <LoadingBadge /> : <></>}
          </div>
        </div>
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
        return (
          <div key={source.path}>
            <ArrayPlots
              source={source}
              /* evPerBin={evPerBin} */
              rois={[]}
              updateRoi={updateRoi}
            />
          </div>
        );
      })}
    </div>
  );
};

////////////////////////////
// Old implementation below
////////////////////////////

// export const OldRunPlots = ({ run }: { run: Run }) => {
//   const renderNumRef = useRef(0);
//   renderNumRef.current += 1;
//   const uid = run.uid;
//   // Get the valid streams for this run
//   const { streams, isLoading: isLoadingStreams } = useStreams(uid);
//   const streamNames = Object.keys(streams);
//   const [lastStreamName, setStream] = useLastChoice(
//     NULL_SIGNAL,
//     streamNames,
//     "stream",
//   );
//   streamNames.sort((a, b) => {
//     // "Primary" should be first and "baseline" should be last
//     if (a === "primary" || b === "baseline") {
//       return -1;
//     } else if (b === "primary" || a === "baseline") {
//       return 1;
//     } else if (a < b) {
//       // We don't have any of the magic values, so just do normal ordering
//       return -1;
//     } else if (a > b) {
//       return 1;
//     }
//     // Values must be identical
//     return 0;
//   });

//   const streamName =
//     lastStreamName === NULL_SIGNAL ? (streamNames?.[0] ?? "") : lastStreamName;

//   // Retrieve metadata and data keys for this dataset
//   const { metadata } = useMetadata<RunMetadata>(uid);

//   if (isLoadingStreams) {
//     return <LoadingBadge />;
//   }

//   let plotTitle: string;
//   let plotSubtitle: string;
//   if (uid === undefined) {
//     return (
//       <div role="alert" className="m-2 alert alert-error alert-soft">
//         <span>
//           <ExclamationTriangleIcon className="size-4 inline" /> No UID was
//           provided.
//         </span>
//       </div>
//     );
//   } else if (metadata == null) {
//     plotTitle = "";
//     plotSubtitle = "";
//   } else {
//     const runMetadata: RunMetadata = metadata?.attributes?.metadata ?? {};
//     plotTitle = `${runMetadata?.start?.sample_name} - ${runMetadata?.start?.scan_name}`;
//     plotSubtitle = `${runMetadata?.start?.uid ?? ""}`;
//   }
//   // Get independent hints from the run
//   const dimensions = run.metadata.start?.hints?.dimensions ?? [];
//   const hints = dimensions
//     .map(([hints, stream_]) => {
//       return stream_ === streamName.split("/").slice(-1)[0] ? hints : [];
//     })
//     .flat();
//   // Make sure we have data to plot
//   const stream = streams?.[streamName] ?? null;
//   if (stream?.data_keys == null) {
//     return (
//       <div role="alert" className="m-2 alert alert-warning alert-soft">
//         <span>
//           <ExclamationTriangleIcon className="size-4 inline" /> Stream contains
//           no data keys.
//         </span>
//       </div>
//     );
//   }

//   return (
//     <div className="m-4">
//       {/* Widget to pick a stream */}
//       <div>
//         <label className="select">
//           <span className="label">Stream:</span>
//           <select
//             className="select"
//             value={streamName}
//             title="Select a data stream"
//             onChange={(e) => {
//               setStream(e.target.value);
//             }}
//           >
//             {streamNames.map((stream) => {
//               return <option key={stream}>{stream}</option>;
//             })}
//           </select>
//         </label>
//       </div>
//       <StreamPlots
//         stream={stream}
//         runHints={hints}
//         plotTitle={plotTitle}
//         plotSubtitle={plotSubtitle}
//         key={uid}
//       />
//     </div>
//   );
// };

// A react component to plot data for a given Bluesky run stream
// @param uid - The unique ID for this run
// @param stream - The stream name within this run to plot.
// export const StreamPlots = ({
//   stream,
//   plotTitle,
//   plotSubtitle,
//   runHints,
// }: {
//   stream: Stream;
//   plotTitle: string;
//   plotSubtitle: string;
//   runHints: string[];
// }) => {
//   // Figure out which options we can even choose from
//   const iHints = Object.entries(stream?.hints ?? {})
//     .map(([, obj]) => obj.fields)
//     .flat();
//   const [hintedOnly, setHintedOnly] = useLastChoice<boolean>(
//     true,
//     [true, false],
//     "hinted",
//   );
//   const [rois, setRois] = useLocalStorage<{ [key: string]: ROI[] }>(
//     `rois-v1`,
//     {},
//   );
//   const dataKeys = {
//     seq_num: {
//       dtype: "int64",
//       shape: [], // To-do, figure out how to get the actual shape
//     },
//     time: {
//       dtype: "float64",
//       shape: [], // To-do, figure out how to get the actual shape
//     },
//     ...stream.data_keys,
//   };
//   const caselessSort = (a: string, b: string) =>
//     a.localeCompare(b, undefined, { sensitivity: "base" });
//   const xSources = signalSources(
//     dataKeys,
//     hintedOnly ? runHints : null,
//     rois,
//     stream,
//   );
//   const xSignals = Object.keys(xSources).sort(caselessSort);
//   const ySources = signalSources(
//     dataKeys,
//     hintedOnly ? iHints : null,
//     rois,
//     stream,
//   );
//   const ySignals = Object.keys(ySources).sort(caselessSort);

//   // State management
//   const [xSignal, setXSignal] = useLastChoice<string>(
//     xSignals[0],
//     xSignals,
//     "xSignal",
//   );
//   const [vSignal, setVSignal] = useLastChoice<string>(
//     ySignals[0],
//     ySignals,
//     "vSignal",
//   );
//   const [rSignal, setRSignal] = useLastChoice<string>(
//     ySignals[0],
//     ySignals,
//     "rSignal",
//   );
//   const [inverted, setInverted] = useLastChoice<boolean>(
//     false,
//     [true, false],
//     "inverted",
//   );
//   const [logarithm, setLogarithm] = useLastChoice<boolean>(
//     false,
//     [true, false],
//     "logarithm",
//   );
//   const [gradient, setGradient] = useLastChoice<boolean>(
//     false,
//     [true, false],
//     "gradient",
//   );
//   const [operation, setOperation] = useLastChoice<string>(
//     "",
//     ["", ...OPERATIONS],
//     "operation",
//   );
//   const referenceDisabled = operation === "";

//   const dataKeyNames = Object.keys(stream?.data_keys ?? {});
//   if (dataKeyNames.length > 0) {
//     if (xSignal == null) setXSignal(dataKeyNames[0]);
//     if (vSignal == null) setVSignal(dataKeyNames[0]);
//     if (rSignal == null) setRSignal(dataKeyNames[0]);
//   }

//   // Check for error conditions due to missing data signals
//   const needsVSignal = vSignal === NULL_SIGNAL;
//   const needsRSignal =
//     rSignal === NULL_SIGNAL && OPERATIONS.includes(operation ?? "");

//   // Handlers for preset configurations
//   const normalMode = () => {
//     setInverted(false);
//     setLogarithm(false);
//     setOperation("");
//   };
//   const fluoroMode = () => {
//     setInverted(false);
//     setLogarithm(false);
//     setOperation("÷");
//   };
//   const transMode = () => {
//     setInverted(true);
//     setLogarithm(true);
//     setOperation("÷");
//   };

//   if (stream == null) {
//     return (
//       <div role="alert" className="m-2 alert alert-warning alert-soft">
//         <span>
//           <ExclamationTriangleIcon className="size-4 inline" /> No stream is
//           selected.
//         </span>
//       </div>
//     );
//   }
//   let infoWidget;
//   if (needsVSignal || needsRSignal) {
//     infoWidget = (
//       <div role="alert" className="m-2 alert alert-warning alert-soft">
//         <span>
//           <ExclamationTriangleIcon className="size-4 inline" /> Select signals
//           above to plot.
//         </span>
//       </div>
//     );
//   }
//   // Build the list of line data sources and show them
//   let plotWidget;

//   if (stream == null) {
//     plotWidget = <></>;
//   } else {
//     const lineSources = [
//       {
//         x: xSources[xSignal],
//         s: ySources[vSignal],
//         r: ySources[rSignal],
//       },
//     ];
//     plotWidget = (
//       <>
//         <LinePlots
//           sources={lineSources}
//           operation={operation ?? ""}
//           inverted={inverted}
//           logarithm={logarithm}
//           plotTitle={plotTitle}
//           plotSubtitle={plotSubtitle}
//           key={stream.uid}
//         />
//       </>
//     );
//   }
//   // Create a plot widget for the array frames if needed
//   const frameSource = ySources?.[vSignal];
//   const isArray = frameSource?.dataKey?.dtype === "array";
//   const objName = frameSource?.dataKey?.object_name;
//   const frameRois = rois?.[objName] ?? [];
//   const evPerBin = stream.configuration?.[objName]?.data?.[
//     `${objName}-ev_per_bin`
//   ] as number | undefined;
//   // Handlers for changing the ROI definitions
//   const addRoi = () => {
//     const theseRois = [
//       ...frameRois,
//       {
//         isActive: true,
//         name: "",
//         x0: 0,
//         y0: 0,
//         x1: 50,
//         y1: 50,
//       },
//     ];
//     setRois({
//       ...rois,
//       [objName]: theseRois,
//     });
//   };
//   const removeRoi = (index: number) => {
//     const newRois = {
//       ...rois,
//       [objName]: [...frameRois.slice(0, index), ...frameRois.slice(index + 1)],
//     };
//     setRois(newRois);
//   };
//   const updateRoi = (index: number, update: ROIUpdate) => {
//     setRois({
//       ...rois,
//       [objName]: [
//         ...frameRois.slice(0, index),
//         {
//           ...frameRois[index],
//           ...update,
//         },
//         ...frameRois.slice(index + 1),
//       ],
//     });
//   };
//   // Create widgets
//   let frameWidget;
//   if (!isArray) {
//     frameWidget = <></>;
//   } else {
//     frameWidget = (
//       <ArrayPlots
//         source={frameSource}
//         evPerBin={evPerBin}
//         rois={frameRois}
//         updateRoi={updateRoi}
//       />
//     );
//   }

//   return (
//     <>
//       <div className="overflow-x-auto">
//         <ul className="list mt-3 mb-3 md:grid md:grid-cols-2 lg:grid-cols-3">
//           <li className="list-row p-0">
//             <label className="label">
//               <input
//                 type="checkbox"
//                 className="checkbox"
//                 checked={hintedOnly}
//                 onChange={(e) => setHintedOnly(e.target.checked)}
//               />
//               Hints only
//             </label>
//           </li>
//           <li className="list-row p-0">
//             <div
//               className="tooltip"
//               data-tip="Horizontal signal used for plotting."
//             >
//               <SignalPicker
//                 signals={xSignals}
//                 signal={xSignal}
//                 onSignalChange={setXSignal}
//                 localKey={"xSignal"}
//                 label="Horizontal"
//               />
//             </div>
//           </li>
//           <li className="list-row p-0">
//             <div
//               className="tooltip"
//               data-tip="Primary data signal (S) used for plotting."
//             >
//               <SignalPicker
//                 signals={ySignals}
//                 signal={vSignal}
//                 error={needsVSignal}
//                 onSignalChange={setVSignal}
//                 localKey={"vSignal"}
//                 label="Signal (S)"
//               />
//             </div>
//           </li>
//           <li className="list-row p-0">
//             <div className="join">
//               <select
//                 className="select w-18 float-left join-item"
//                 value={operation ?? ""}
//                 role="listbox"
//                 onChange={(e) => {
//                   setOperation((e.target as HTMLSelectElement).value);
//                 }}
//               >
//                 <option></option>
//                 <option>+</option>
//                 <option>−</option>
//                 <option>×</option>
//                 <option>÷</option>
//               </select>
//               <div
//                 className="tooltip"
//                 data-tip="Reference signal (R) used for plotting."
//               >
//                 <SignalPicker
//                   signals={ySignals}
//                   signal={rSignal}
//                   disabled={referenceDisabled}
//                   error={needsRSignal}
//                   onSignalChange={setRSignal}
//                   localKey={"rSignal"}
//                   label="Reference (R)"
//                 />
//               </div>
//             </div>
//           </li>
//           <li className="list-row">
//             <div className="w-30">Presets: </div>
//             <div className="join">
//               <button className="btn btn-soft join-item" onClick={normalMode}>
//                 <InlineMath math="S" />
//               </button>
//               <button className="btn btn-soft join-item" onClick={fluoroMode}>
//                 <InlineMath math="\frac{S}{R}" />
//               </button>
//               <button className="btn btn-soft join-item" onClick={transMode}>
//                 <InlineMath math="\ln \frac{R}{S}" />
//               </button>
//             </div>
//           </li>
//           <li className="col-span-2">
//             <div className="space-x-4 m-2 ">
//               <label className="label">
//                 <input
//                   type="checkbox"
//                   className="checkbox"
//                   checked={inverted}
//                   onChange={(e) => setInverted(e.target.checked)}
//                 />
//                 Inverted <InlineMath math="\big(\frac{1}{y}\big)" />
//               </label>
//               <label className="label">
//                 <input
//                   type="checkbox"
//                   className="checkbox"
//                   checked={logarithm}
//                   onChange={(e) => setLogarithm(e.target.checked)}
//                 />
//                 Natural logarithm
//               </label>
//               {/* Need to get a good gradient function. */}
//               <div
//                 className="tooltip"
//                 data-tip="This feature is in development. Stay tuned."
//               >
//                 <label className="label disabled">
//                   <input
//                     type="checkbox"
//                     className="checkbox"
//                     disabled
//                     checked={gradient}
//                     onChange={(e) => setGradient(e.target.checked)}
//                   />
//                   Derivative
//                 </label>
//               </div>
//             </div>
//           </li>
//         </ul>
//       </div>

//       {infoWidget}
//       {plotWidget}
//       {frameWidget}

//       <div
//         tabIndex={0}
//         className="collapse collapse-arrow bg-base-100 border-base-300 border"
//       >
//         <input type="checkbox" />
//         <div className="collapse-title font-semibold">
//           Regions of Interest (ROIs)
//         </div>
//         <div className="collapse-content text-sm">
//           <RoiTable
//             rois={frameRois}
//             addRoi={addRoi}
//             updateRoi={updateRoi}
//             removeRoi={removeRoi}
//           />
//         </div>
//       </div>
//     </>
//   );
// };

// export function TablePlots({
//   stream,
//   xSignal,
//   vSignal,
//   rSignal,
//   operation,
//   inverted,
//   logarithm,
//   plotTitle,
//   plotSubtitle,
// }: {
//   stream: Stream;
//   xSignal: string | null;
//   vSignal: string | null;
//   rSignal: string | null;
//   operation: string;
//   inverted: boolean;
//   logarithm: boolean;
//   plotTitle?: string;
//   plotSubtitle?: string;
// }) {
//   // Open connections to listen for latest data
//   const {
//     isLoading: isLoadingData,
//     readyState,
//     table: data,
//   } = useDataTable(stream);

//   // Process data into a form consumable by the plots
//   let xdata, vdata, dataSets: LineData[];
//   if (isLoadingData || data == null) {
//     dataSets = [];
//   } else {
//     xdata = xSignal != null ? data.getChild(xSignal)?.toArray() : null;
//     xdata = toNumberArray(xdata);
//     vdata = vSignal != null ? data.getChild(vSignal)?.toArray() : null;
//     vdata = toNumberArray(vdata);
//     const rdata = rSignal != null ? data.getChild(rSignal)?.toArray() : null;
//     dataSets =
//       vdata == null
//         ? []
//         : [{ x: xdata, y: vdata }].map(({ x, y }) => {
//             return {
//               x,
//               y: prepareYData(y, toNumberArray(rdata), operation, {
//                 inverted: inverted,
//                 logarithm: logarithm,
//               }),
//             };
//           });
//   }

//   // Decide on plot annotations based on data processing
//   // Decide what kind of thing to show
//   if (isLoadingData) {
//     return <div className="skeleton h-112 w-175"></div>;
//   }

//   const labels = axisLabels({
//     xSignal: [xSignal ?? "", null],
//     vSignal: [vSignal ?? "", null],
//     rSignal: [rSignal ?? "", null],
//     inverted,
//     logarithm,
//     operation,
//   });
//   return (
//     <>
//       <div className="m-2">
//         <LiveBadge readyState={readyState} />
//       </div>

//       <LinePlot
//         data={dataSets}
//         xlabel={labels.x}
//         ylabel={labels.y}
//         title={plotTitle}
//         subtitle={plotSubtitle}
//       />
//     </>
//   );
// }

// Component that shows plots for a frame of an array.
//
// Will either show an image (heatmap) or individual spectra. If
// spectra are shown, *evPerBin* determines the extent of the
// horizontal axis.
//
// @param evPerBin - The energy width of each pixel in electron-volts.
export function ArrayPlots({
  source,
  rois,
  updateRoi,
  evPerBin,
}: {
  source: DataSource;
  rois: ROI[];
  updateRoi: (index: number, update: ROIUpdate) => void;
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
  // const frame = useArrayData(arrayPath, activeFrame);
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

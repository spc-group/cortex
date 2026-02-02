import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { useState, useRef } from "react";

import { LinePlot } from "../plots";
import { FramePlot } from "../plots";
import { SignalPicker } from "../plots/signal_picker";
import { prepareYData } from "./prepare_data";
import { LiveBadge } from "./live_badge";
import {
  useDataTable,
  useStreams,
  useMetadata,
  useArray,
  useArrayStats,
} from "../tiled";
import { axisLabels, OPERATIONS } from "./axis_labels";
import type { TypedArray } from "../tiled/types";
import type { Run, Stream, RunMetadata } from "../catalog/types";
import { useLastChoice } from "../plots/last_choice.ts";

const NULL_SIGNAL = "---";

const toNumberArray = (intArray: BigInt64Array) => {
  const numberArray = [];
  if (intArray == null) {
    return intArray;
  }
  for (const n of intArray) {
    numberArray.push(Number(n));
  }
  return numberArray;
};

export const RunPlots = ({ run }: { run: Run }) => {
  const uid = run.uid;
  // Get the valid streams for this run
  const [streamName, setStream] = useState(NULL_SIGNAL);
  const { streams, isLoading: isLoadingStreams } = useStreams(uid);
  const streamNames = Object.keys(streams);
  streamNames.sort((a, b) => {
    // "Primary" should be first and "baseline" should be last
    if (a === "primary" || b === "baseline" || a < b) {
      return -1;
    } else if (b === "primary" || a === "baseline" || a > b) {
      return 1;
    } else {
      return 0;
    }
  });

  // Select the primary stream by default
  if (
    streamName === NULL_SIGNAL &&
    !isLoadingStreams &&
    streamNames.length > 0
  ) {
    setStream(streamNames[0]);
  }

  // Retrieve metadata and data keys for this dataset
  const { metadata } = useMetadata<RunMetadata>(uid);

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
  // Get independent hints from the run
  const dimensions = run.metadata.start?.hints?.dimensions ?? [];
  const hints = dimensions
    .map(([hints, stream_]) => {
      return stream_ === streamName.split("/").slice(-1)[0] ? hints : [];
    })
    .flat();
  return (
    <div className="m-4">
      {/* Widget to pick a stream */}
      <div>
        Stream:
        <select
          className="select"
          value={streamName}
          title="Select a data stream"
          onChange={(e) => {
            setStream(e.target.value);
          }}
        >
          {streamNames.map((stream) => {
            return <option key={stream}>{stream}</option>;
          })}
        </select>
      </div>
      <StreamPlots
        stream={streams?.[streamName] ?? null}
        runHints={hints}
        plotTitle={plotTitle}
        plotSubtitle={plotSubtitle}
        key={uid}
      />
    </div>
  );
};

// A react component to plot data for a given Bluesky run stream
// @param uid - The unique ID for this run
// @param stream - The stream name within this run to plot.
export const StreamPlots = ({
  stream,
  plotTitle,
  plotSubtitle,
  runHints,
}: {
  stream: Stream;
  plotTitle: string;
  plotSubtitle: string;
  runHints: string[];
}) => {
  const [xSignal, setXSignal] = useState<string | null>(null);
  const [vSignal, setVSignal] = useState<string | null>(null);
  const [rSignal, setRSignal] = useState<string | null>(null);
  const [inverted, setInverted] = useState(false);
  const [logarithm, setLogarithm] = useState(false);
  const [gradient, setGradient] = useState(false);
  const [operation, setOperation] = useLastChoice<string>(
    "",
    ["", ...OPERATIONS],
    "operation",
  );
  const referenceDisabled = operation === "";

  const dataKeyNames = Object.keys(stream?.data_keys ?? {});
  if (dataKeyNames.length > 0) {
    if (xSignal == null) setXSignal(dataKeyNames[0]);
    if (vSignal == null) setVSignal(dataKeyNames[0]);
    if (rSignal == null) setRSignal(dataKeyNames[0]);
  }
  const iHints = Object.entries(stream?.hints ?? {})
    .map(([, obj]) => obj.fields)
    .flat();

  // Check for error conditions due to missing data signals
  const needsVSignal = vSignal === NULL_SIGNAL;
  const needsRSignal =
    rSignal === NULL_SIGNAL && OPERATIONS.includes(operation ?? "");

  // Handlers for preset configuration
  const normalMode = () => {
    setInverted(false);
    setLogarithm(false);
    setOperation("");
  };
  const fluoroMode = () => {
    setInverted(false);
    setLogarithm(false);
    setOperation("÷");
  };
  const transMode = () => {
    setInverted(true);
    setLogarithm(true);
    setOperation("÷");
  };

  if (stream == null) {
    return (
      <div role="alert" className="m-2 alert alert-warning alert-soft">
        <span>
          <ExclamationTriangleIcon className="size-4 inline" /> No stream is
          selected.
        </span>
      </div>
    );
  }

  let infoWidget;
  if (needsVSignal || needsRSignal) {
    infoWidget = (
      <div role="alert" className="m-2 alert alert-warning alert-soft">
        <span>
          <ExclamationTriangleIcon className="size-4 inline" /> Select signals
          above to plot.
        </span>
      </div>
    );
  }

  const vKey = vSignal != null ? stream?.data_keys?.[vSignal] : null;
  let plotWidget;
  if (stream == null) {
    plotWidget = <></>;
  } else if (vKey?.dtype === "array") {
    plotWidget = (
      <ArrayPlots
        stream={stream}
        xSignal={xSignal}
        vSignal={vSignal}
        rSignal={rSignal}
        operation={operation ?? ""}
        inverted={inverted}
        logarithm={logarithm}
        plotTitle={plotTitle}
        plotSubtitle={plotSubtitle}
        key={stream.uid}
      />
    );
  } else {
    plotWidget = (
      <TablePlots
        stream={stream}
        xSignal={xSignal}
        vSignal={vSignal}
        rSignal={rSignal}
        operation={operation ?? ""}
        inverted={inverted}
        logarithm={logarithm}
        plotTitle={plotTitle}
        plotSubtitle={plotSubtitle}
        key={stream.uid}
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="table table-sm max-w-md">
          <tbody>
            <tr>
              <th>Horizontal:</th>
              <th>
                <div
                  className="tooltip"
                  data-tip="Horizontal signal used for plotting."
                >
                  <SignalPicker
                    dataKeys={stream.data_keys}
                    onSignalChange={setXSignal}
                    localKey={"xSignal"}
                    hints={runHints}
                  />
                </div>
              </th>
            </tr>
            <tr>
              <th>Signal (S):</th>
              <th className="flex">
                <div
                  className="tooltip"
                  data-tip="Primary data signal (S) used for plotting."
                >
                  <SignalPicker
                    dataKeys={stream.data_keys}
                    error={needsVSignal}
                    onSignalChange={setVSignal}
                    localKey={"vSignal"}
                    hints={iHints}
                  />
                </div>
              </th>
            </tr>
            <tr>
              <th>Reference (R):</th>
              <th>
                <select
                  className="select w-18 float-left"
                  value={operation ?? ""}
                  role="listbox"
                  onChange={(e) => {
                    setOperation((e.target as HTMLSelectElement).value);
                  }}
                >
                  <option></option>
                  <option>+</option>
                  <option>−</option>
                  <option>×</option>
                  <option>÷</option>
                </select>
                <div
                  className="tooltip"
                  data-tip="Reference signal (R) used for plotting."
                >
                  <SignalPicker
                    disabled={referenceDisabled}
                    dataKeys={stream.data_keys}
                    error={needsRSignal}
                    onSignalChange={setRSignal}
                    localKey={"rSignal"}
                    hints={iHints}
                  />
                </div>
              </th>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="space-x-2">
        <span>Presets: </span>
        <button className="btn btn-soft" onClick={normalMode}>
          <InlineMath math="S" />
        </button>
        <button className="btn btn-soft" onClick={fluoroMode}>
          <InlineMath math="\frac{S}{R}" />
        </button>
        <button className="btn btn-soft" onClick={transMode}>
          <InlineMath math="\ln \frac{R}{S}" />
        </button>
      </div>

      <div className="space-x-4 m-2">
        <label className="label">
          <input
            type="checkbox"
            className="checkbox"
            checked={inverted}
            onChange={(e) => setInverted(e.target.checked)}
          />
          Inverted <InlineMath math="\big(\frac{1}{y}\big)" />
        </label>
        <label className="label">
          <input
            type="checkbox"
            className="checkbox"
            checked={logarithm}
            onChange={(e) => setLogarithm(e.target.checked)}
          />
          Natural logarithm
        </label>
        {/* Need to get a good gradient function. */}
        <div
          className="tooltip"
          data-tip="This feature is in development. Stay tuned."
        >
          <label className="label disabled">
            <input
              type="checkbox"
              className="checkbox"
              disabled
              checked={gradient}
              onChange={(e) => setGradient(e.target.checked)}
            />
            Derivative
          </label>
        </div>
      </div>

      {infoWidget}
      {plotWidget}
    </>
  );
};

export function TablePlots({
  stream,
  xSignal,
  vSignal,
  rSignal,
  operation,
  inverted,
  logarithm,
  plotTitle,
  plotSubtitle,
}: {
  stream: Stream;
  xSignal: string | null;
  vSignal: string | null;
  rSignal: string | null;
  operation: string;
  inverted: boolean;
  logarithm: boolean;
  plotTitle?: string;
  plotSubtitle?: string;
}) {
  // Open connections to listen for latest data
  const {
    isLoading: isLoadingData,
    readyState,
    table: data,
  } = useDataTable(stream);

  // Process data into a form consumable by the plots
  let xdata, vdata, rdata;
  if (isLoadingData || data == null) {
    xdata = null;
    vdata = null;
    rdata = null;
  } else {
    xdata = xSignal != null ? data.getChild(xSignal)?.toArray() : null;
    xdata = toNumberArray(xdata);
    vdata = vSignal != null ? data.getChild(vSignal)?.toArray() : null;
    vdata = toNumberArray(vdata);
    rdata = rSignal != null ? data.getChild(rSignal)?.toArray() : null;
    rdata = toNumberArray(rdata);
  }

  // Apply reference correction and processing steps
  const ydata = prepareYData(vdata, rdata, operation, {
    inverted: inverted,
    logarithm: logarithm,
  });

  // Decide on plot annotations based on data processing
  // Decide what kind of thing to show
  if (isLoadingData) {
    return <div className="skeleton h-112 w-175"></div>;
  }

  const labels = axisLabels({
    xSignal: [xSignal ?? "", null],
    vSignal: [vSignal ?? "", null],
    rSignal: [rSignal ?? "", null],
    inverted,
    logarithm,
    operation,
  });

  return (
    <>
      <div className="m-2">
        <LiveBadge readyState={readyState} />
      </div>

      <LinePlot
        xdata={xdata}
        ydata={ydata}
        xlabel={labels.x}
        ylabel={labels.y}
        title={plotTitle}
        subtitle={plotSubtitle}
      />
    </>
  );
}

export function ArrayPlots({
  stream,
  xSignal,
  vSignal,
  rSignal,
  operation,
  inverted,
  logarithm,
  plotTitle,
  plotSubtitle,
}: {
  stream: Stream;
  xSignal: string | null;
  vSignal: string | null;
  rSignal: string | null;
  operation: string;
  inverted: boolean;
  logarithm: boolean;
  plotTitle?: string;
  plotSubtitle?: string;
}) {
  // Open connections to listen for latest data
  const {
    isLoading: isLoadingTable,
    readyState,
    table: data,
  } = useDataTable(stream);

  const arrayPath = [...stream.ancestors, stream.key, vSignal].join("/");
  const [activeFrame, setActiveFrame] = useState(0);
  const previousFrame = useRef<TypedArray[] | null>(null);
  const { array: frameData, shape: frameShape } = useArray(arrayPath, [
    activeFrame,
  ]);
  const { sum, max, min, isLoading: isLoadingStats } = useArrayStats(arrayPath);
  const lastFrame = (frameShape?.[0] ?? 1) - 1;
  if (frameData != null) {
    previousFrame.current = frameData[0];
  }

  // Process data into a form consumable by the plots
  let xdata, vdata, rdata;
  if (isLoadingTable || data == null || isLoadingStats) {
    xdata = null;
    vdata = null;
    rdata = null;
  } else {
    xdata = xSignal != null ? data.getChild(xSignal)?.toArray() : null;
    xdata = toNumberArray(xdata);
    vdata = sum;
    rdata = rSignal != null ? data.getChild(rSignal)?.toArray() : null;
    rdata = toNumberArray(rdata);
  }

  // Apply reference correction and processing steps
  const ydata = prepareYData(vdata, rdata, operation, {
    inverted: inverted,
    logarithm: logarithm,
  });

  const labels = axisLabels({
    xSignal: [xSignal ?? "", null],
    vSignal: [vSignal ?? "", null],
    rSignal: [rSignal ?? "", null],
    inverted,
    logarithm,
    operation,
  });

  const imData = frameData?.[0] ?? previousFrame.current;

  // Prepare color range for the frame plot
  const reduceStat = (
    arr: (number | null)[] | null,
    compare: (...values: number[]) => number,
    defaultValue: number,
  ) => {
    if (arr == null) {
      return null;
    } else {
      return arr.reduce(
        (cumulative, next) =>
          compare(cumulative ?? defaultValue, next ?? defaultValue),
        defaultValue,
      );
    }
  };
  const vMin = reduceStat(min, Math.min, Infinity);
  const vMax = reduceStat(max, Math.max, -Infinity);
  // const vMin = (min == null) ? null : min.reduce((min, value) => Math.min(min ?? Infinity, value ?? Infinity), Infinity);
  // const vMax = (max == null) ? null : max.reduce((max, value) => Math.max(max ?? -Infinity, value ?? -Infinity), -Infinity);

  return (
    <>
      <div className="m-2">
        <LiveBadge readyState={readyState} />
      </div>
      {isLoadingTable || isLoadingStats ? (
        <div className="skeleton h-112 w-175"></div>
      ) : (
        <LinePlot
          xdata={xdata}
          ydata={ydata}
          xlabel={labels.x}
          ylabel={labels.y}
          title={plotTitle}
          subtitle={plotSubtitle}
          activePoint={activeFrame}
        />
      )}

      <div>
        <label className="input w-130">
          <span className="label">Current frame:</span>
          <span>{activeFrame}</span>
          <input
            type="range"
            min={0}
            max={lastFrame}
            value={activeFrame}
            onChange={(e) => {
              setActiveFrame(Number(e.target.value));
            }}
            className="range"
            step="1"
          />
          <span>{lastFrame}</span>
        </label>
      </div>

      {imData != null && vMin != null && vMax != null ? (
        <>
          <FramePlot frame={imData} vMin={vMin} vMax={vMax} />
        </>
      ) : (
        <div className="skeleton h-[457px] w-[700px]"></div>
      )}
    </>
  );
}

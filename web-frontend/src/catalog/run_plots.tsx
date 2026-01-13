import {
  ExclamationTriangleIcon,
  SignalIcon,
  SignalSlashIcon,
} from "@heroicons/react/24/solid";
import { useState } from "react";
import { NavLink } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ReadyState } from "react-use-websocket";

import { LinePlot } from "../plots/lineplot";
import { SignalPicker } from "../plots/signal_picker";
import { getTableData } from "../tiled/tiled_api";
import { getMetadata } from "../tiled/tiled_api";
import { prepareYData } from "./prepare_data";
import { LiveBadge } from "./live_badge";
import { useLatestData } from "../tiled/streaming";
import { useMetadata } from "../tiled/use_metadata";

import type { webSocketMessage } from "../types";
import {useStreams } from "../tiled/use_streams";


const NULL_SIGNAL = "---";
const OPERATIONS = ["+", "−", "×", "÷"];


export const RunPlots = ({
  uid,
  plotStyle,
}: {
  uid: string;
  plotStyle?: string;
}) => {
  // Get the valid streams for this run
  const [streamName, setStream] = useState(NULL_SIGNAL);
  const needsStream = streamName === NULL_SIGNAL;
  const { streams, isLoading: isLoadingStreams } = useStreams(uid);
  const streamNames = Object.keys(streams);
  const stream = streams?.[streamName];

  // Select the primary stream by default
  if (streamName === NULL_SIGNAL && !isLoadingStreams && streamNames.length > 0) {
    setStream(streamNames[0]);
  }

  // Retrieve metadata and data keys for this dataset
  const { isLoading: isLoadingMetadata, data: runMetadata } = useMetadata(uid);

  let plot;
  if (uid === undefined) {
    plot = (
      <div role="alert" className="m-2 alert alert-error alert-soft">
        <span>
          <ExclamationTriangleIcon className="size-4 inline" /> No UID was
          provided.
        </span>
      </div>
    );
  } else if (needsStream) {
    plot = (
      <div role="alert" className="m-2 alert alert-warning alert-soft">
        <span>
          <ExclamationTriangleIcon className="size-4 inline" /> Select signals
          above to plot.
        </span>
      </div>
    );
  } else {
    plot = (
      <StreamPlots uid={uid} stream={streams?.[streamName] ?? {}} plotStyle={plotStyle} />
    );
  }
  
  return (
    <div className="m-4">
      {/* Header for the run as a whole */}
      <h2 className="text-2xl/7 font-bold text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
        {isLoadingMetadata ? (
          <div className="skeleton" />
        ) : (
          runMetadata["start.scan_name"]
        )}
      </h2>
      <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
        <div className="mt-2 flex items-center text-sm text-gray-500">
          {isLoadingMetadata ? <div className="skeleton" /> : runMetadata.uid}
        </div>
      </div>

      <div>
        Stream:
        <select className="select" value={streamName} onChange={(e) => {setStream(e.target.value)}}>
          {streamNames.map( (stream) => {
            return <option key={stream}>{stream}</option>
          })}
        </select>
      </div>

      {plot}
    </div>
  );
};


// A react component to plot data for a given Bluesky run stream
// @param uid - The unique ID for this run
// @param stream - The stream name within this run to plot.
export const StreamPlots = ({uid, stream, plotStyle}: {uid: string, stream: Stream, plotStyle: string}) => {
  const [xSignal, setXSignal] = useState(NULL_SIGNAL);
  const [vSignal, setVSignal] = useState(NULL_SIGNAL);
  const [rSignal, setRSignal] = useState(NULL_SIGNAL);
  const [inverted, setInverted] = useState(false);
  const [logarithm, setLogarithm] = useState(false);
  const [operation, setOperation] = useState("");
  const referenceDisabled = operation === "";

    // Check for error conditions due to missing data signals
  const needsVSignal = vSignal === NULL_SIGNAL;
  const needsRSignal = rSignal === NULL_SIGNAL && OPERATIONS.includes(operation);

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

  let plot;
  if (needsVSignal || needsRSignal) {
    plot = (
      <div role="alert" className="m-2 alert alert-warning alert-soft">
        <span>
          <ExclamationTriangleIcon className="size-4 inline" /> Select signals
          above to plot.
        </span>
      </div>
    );
  } else {
    plot = (<DataPlots uid={uid} stream={stream} xSignal={xSignal} vSignal={vSignal} rSignal={rSignal} plotStyle={plotStyle} operation={operation} inverted={inverted} logarithm={logarithm} />);
  }

  return (
      <>
        <div className="overflow-x-auto">
          <table className="table table-sm max-w-md">
            <tbody>
              <tr>
                <th>Horizontal:</th>
                <th>
                  <SignalPicker
                    uid={uid}
                    stream={stream}
                    onSignalChange={(e) => {
                      setXSignal((e.target as HTMLSelectElement).value);
                    }}
                  />
                </th>
              </tr>
              <tr>
                <th>Vertical:</th>
                <th className="flex">
                  <SignalPicker
                    uid={uid}
                    stream={stream}
                    error={needsVSignal}
                    onSignalChange={(e) => {
                      setVSignal((e.target as HTMLSelectElement).value);
                    }}
                  />
                  <select
                    className="select w-18 float-left"
                    value={operation}
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
                  <SignalPicker
                    disabled={referenceDisabled}
                    uid={uid}
                    stream={stream}
                    error={needsRSignal}
                    onSignalChange={(e) => {
                      setRSignal((e.target as HTMLSelectElement).value);
                    }}
                  />
                </th>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="space-x-4">
          <label className="label">
            <input
              type="checkbox"
              className="checkbox"
              checked={inverted}
              onChange={(e) => setInverted(e.target.checked)}
            />
            Invert
          </label>
          <label className="label">
            <input
              type="checkbox"
              className="checkbox"
              checked={logarithm}
              onChange={(e) => setLogarithm(e.target.checked)}
            />
            Natural log
          </label>
          {/* Need to get a good gradient function. */}
          {/* <label className="label"> */}
          {/*   <input type="checkbox" className="checkbox" checked={gradient} onChange={(e) => setGradient(e.target.checked)} /> */}
          {/*   Gradient */}
          {/* </label> */}
        </div>
        <div className="space-x-2">
          <span>Presets: </span>
          <button className="btn btn-soft" onClick={normalMode}>
            Simple
          </button>
          <button className="btn btn-soft" onClick={transMode}>
            Transmission
          </button>
          <button className="btn btn-soft" onClick={fluoroMode}>
            Fluorescence
          </button>
        </div>
        {plot}
  
    </>
  );
};


export function DataPlots({
  stream,
  xSignal,
  vSignal,
  rSignal,
  operation,
  inverted,
  logarithm,
  plotStyle,
}: {
  stream: Stream;
  xSignal: string,
  vSignal: string,
  rSignal: string,
  operation: string,
  inverted: boolean,
  logarithm: boolean,
  plotStyle?: string;
}) {
  // Open a websocket connection to listen for data updates
  const uid = stream.ancestors[0];
  const streamKey = [...stream.ancestors.slice(1), stream.key].join('/');
  const { sequence, readyState } = useLatestData(uid, streamKey);

  const { isLoading: isLoadingData, data } = useQuery({
    queryFn: async () => await getTableData(streamKey, uid, [xSignal, vSignal, rSignal]),
    queryKey: ["table", streamKey, uid, xSignal, vSignal, rSignal, sequence],
  });
  const { isLoading: isLoadingMetadata, data: runMetadata } = useQuery({
    queryFn: async () => await getMetadata(uid),
    queryKey: ["metadata", uid],
  });
  const plotTitle = runMetadata?.start?.sample_name + " " + runMetadata?.start?.scan_name;


  // Process data into a form consumable by the plots
  let xdata, vdata, rdata;
  if (isLoadingData) {
    xdata = null;
    vdata = null;
    rdata = null;
  } else {
    xdata = xSignal !== NULL_SIGNAL ? data[xSignal] : null;
    vdata = vSignal !== NULL_SIGNAL ? data[vSignal] : null;
    rdata = rSignal !== NULL_SIGNAL ? data[rSignal] : null;
  }

  // Apply reference correction and processing steps
  const ydata = prepareYData(vdata, rdata, operation, {
    inverted: inverted,
    logarithm: logarithm,
  });

  // Decide on plot annotations based on data processing
  let ylabel = vSignal;
  if (OPERATIONS.includes(operation)) {
    ylabel = `${ylabel} ${operation} ${rSignal}`;
  }
  if (inverted) {
    ylabel = `( ${ylabel} )⁻`;
  }
  if (logarithm) {
    ylabel = `ln( ${ylabel} )`;
  }
  // Decide what kind of thing to show
  let widget;
   if (isLoadingData) {
     widget = <div className="skeleton h-112 w-175"></div>;
   } else if (ydata == null) {
    widget = (
      <div role="alert" className="m-2 alert alert-error alert-soft">
        <span>
          <ExclamationTriangleIcon className="size-4 inline" /> An unknown error
          has occurred.
        </span>
      </div>
    );
  } else if (plotStyle === "lineplot") {
    widget = (
      <LinePlot
        xdata={xdata}
        ydata={ydata}
        uid={uid}
        xlabel={xSignal}
        ylabel={ylabel}
        title={plotTitle}
      />
    );
  };

  return (
    <>
      <div className="m-2"><LiveBadge readyState={readyState} /></div>

      <div role="tablist" className="tabs tabs-border">
        <NavLink to="../multiples" relative="path" role="tab" className="tab">
          Multiples
        </NavLink>
        <NavLink to="../lineplot" relative="path" role="tab" className="tab">
          Line
        </NavLink>
        <NavLink to="../gridplot" relative="path" role="tab" className="tab">
          Grid
        </NavLink>
        <NavLink to="../frames" relative="path" role="tab" className="tab">
          Frames
        </NavLink>
      </div>

      {widget}
    </>
  );
}

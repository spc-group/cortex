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
  const [xSignal, setXSignal] = useState(NULL_SIGNAL);
  const [vSignal, setVSignal] = useState(NULL_SIGNAL);
  const [rSignal, setRSignal] = useState(NULL_SIGNAL);
  const [inverted, setInverted] = useState(false);
  const [logarithm, setLogarithm] = useState(false);
  const [operation, setOperation] = useState("");
  const [stream, setStream] = useState(NULL_SIGNAL);
  const { streams, isLoading: isLoadingStreams } = useStreams(uid);

  // Select the primary stream by default
  if (stream === NULL_SIGNAL && !isLoadingStreams && streams.length > 0) {
    setStream(streams[0]);
  }
  const referenceDisabled = operation === "";

  // Retrieve metadata and data keys for this dataset
  const { isLoading: isLoadingMetadata, data: runMetadata } = useMetadata(uid);

  // Check for error conditions due to missing data signals
  const needsVSignal = vSignal === NULL_SIGNAL;
  const needsRSignal = rSignal === NULL_SIGNAL && OPERATIONS.includes(operation);
  const needsStream = stream === NULL_SIGNAL;
  
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
  if (uid === undefined) {
    plot = (
      <div role="alert" className="m-2 alert alert-error alert-soft">
        <span>
          <ExclamationTriangleIcon className="size-4 inline" /> No UID was
          provided.
        </span>
      </div>
    );
  } else if (needsVSignal || needsRSignal || needsStream) {
    plot = (
      <div role="alert" className="m-2 alert alert-warning alert-soft">
        <span>
          <ExclamationTriangleIcon className="size-4 inline" /> Select signals
          above to plot.
        </span>
      </div>
    );
  } else {
    plot = (<RunDataPlots uid={uid} stream={stream} xSignal={xSignal} vSignal={vSignal} rSignal={rSignal} plotStyle={plotStyle} />);
  }

  let signalPickers;
  if (stream === NULL_SIGNAL) {
    signalPickers = (<></>);
  } else {
    signalPickers = (
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
      </>    
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
        <select className="select" value={stream} onChange={(e) => {setStream(e.target.value)}}>
          {(streams ?? []).map( (stream) => {
            return <option key={stream}>{stream}</option>
          })}
        </select>
      </div>

      {signalPickers}

      {plot}
    </div>
  );
};


export function RunDataPlots({
  uid,
  stream,
  xSignal,
  vSignal,
  rSignal,
  operation,
  inverted,
  logarithm,
  plotStyle,
  webSocketHook,
}: {
  uid: string;
  stream: string;
  xSignal: string,
  vSignal: string,
  rSignal: string,
  operation: string,
  inverted: boolean,
  logarithm: boolean,
  plotStyle?: string;
  webSocketHook?: (a: string) => webSocketMessage;
}) {
  // For new runs: WebSocket /api/v1/stream/single/?envelope_format=msgpack"
  // For new data: WebSocket /api/v1/stream/single/05cb2ba3-5ce1-4b86-bf37-629ceadea73b/streams/primary/internal?envelope_format=msgpack
  // const { lastMessage, readyState } = useWebSocket(socketUrl)

  // Open a websocket connection to listen for data updates
  const { sequence, readyState } = useLatestData(uid, stream, {
    webSocketHook: webSocketHook,
  });

  const { isLoading: isLoadingData, data } = useQuery({
    queryFn: async () => await getTableData(stream, uid, [xSignal, vSignal, rSignal]),
    queryKey: ["table", stream, uid, xSignal, vSignal, rSignal, sequence],
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

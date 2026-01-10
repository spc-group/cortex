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
import { getTableData } from "../tiled_api";
import { getMetadata } from "../tiled_api";
import { prepareYData } from "./prepare_data";
import { useLatestData } from "../streaming";

import type { webSocketMessage } from "../types";

export function RunPlots({
  uid,
  plotStyle,
  webSocketHook,
}: {
  uid: string;
  plotStyle?: string;
  webSocketHook?: (a: string) => webSocketMessage;
}) {
  const [xSignal, setXSignal] = useState("---");
  const [vSignal, setVSignal] = useState("---");
  const [rSignal, setRSignal] = useState("---");
  const [inverted, setInverted] = useState(false);
  const [logarithm, setLogarithm] = useState(false);
  const [operation, setOperation] = useState("");
  const stream = "primary";

  const referenceDisabled = operation === "";

  // Retrieve metadata and data keys for this dataset
  const { isLoading: isLoadingMetadata, data: runMetadata } = useQuery({
    queryFn: async () => await getMetadata(uid),
    queryKey: ["metadata", uid],
  });

  // For new runs: WebSocket /api/v1/stream/single/?envelope_format=msgpack"
  // For new data: WebSocket /api/v1/stream/single/05cb2ba3-5ce1-4b86-bf37-629ceadea73b/streams/primary/internal?envelope_format=msgpack
  // const { lastMessage, readyState } = useWebSocket(socketUrl)

  // Open a websocket connection to listen for data updates
  const { sequence, readyState } = useLatestData(uid, stream, {
    webSocketHook: webSocketHook,
  });

  // Decide on a badge for the connection state
  let liveBadge;
  switch (readyState) {
    case ReadyState.OPEN:
      liveBadge = (
        <div className="badge badge-soft badge-success">
          <SignalIcon className="size-4 inline" /> Live
        </div>
      );
      break;
    case ReadyState.CONNECTING:
      liveBadge = (
        <div className="badge badge-soft badge-info">
          <SignalSlashIcon className="size-4 inline" /> Connecting
        </div>
      );
      break;
    case ReadyState.CLOSING:
    case ReadyState.UNINSTANTIATED:
    case ReadyState.CLOSED:
      liveBadge = (
        <div className="badge badge-soft badge-warning">
          <SignalSlashIcon className="size-4 inline" /> Disconnected
        </div>
      );
      break;
  }

  const { isLoading: isLoadingData, data } = useQuery({
    queryFn: async () =>
      await getTableData(stream, uid, [xSignal, vSignal, rSignal]),
    queryKey: ["table", stream, uid, xSignal, vSignal, rSignal, sequence],
  });

  // Process data into a form consumable by the plots
  let xdata, vdata, rdata;
  if (isLoadingData) {
    xdata = null;
    vdata = null;
    rdata = null;
  } else {
    xdata = xSignal !== "---" ? data[xSignal] : null;
    vdata = vSignal !== "---" ? data[vSignal] : null;
    rdata = rSignal !== "---" ? data[rSignal] : null;
  }

  // Apply reference correction and processing steps
  const ydata = prepareYData(vdata, rdata, operation, {
    inverted: inverted,
    logarithm: logarithm,
  });

  // Check for error conditions due to missing data
  const needsVSignal = vSignal === "---";
  const operations = ["+", "−", "×", "÷"];
  const needsRSignal = rSignal === "---" && operations.includes(operation);

  // Decide on plot annotations based on data processing
  let ylabel = vSignal;
  if (operations.includes(operation)) {
    ylabel = `${ylabel} ${operation} ${rSignal}`;
  }
  if (inverted) {
    ylabel = `( ${ylabel} )⁻`;
  }
  if (logarithm) {
    ylabel = `ln( ${ylabel} )`;
  }
  const plotTitle =
    runMetadata?.start?.sample_name + " " + runMetadata?.start?.scan_name;

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
  } else if (needsVSignal || needsRSignal) {
    plot = (
      <div role="alert" className="m-2 alert alert-warning alert-soft">
        <span>
          <ExclamationTriangleIcon className="size-4 inline" /> Select signals
          above to plot.
        </span>
      </div>
    );
  } else if (isLoadingData) {
    plot = <div className="skeleton h-112 w-175"></div>;
  } else if (ydata == null) {
    plot = (
      <div role="alert" className="m-2 alert alert-error alert-soft">
        <span>
          <ExclamationTriangleIcon className="size-4 inline" /> An unknown error
          has occurred.
        </span>
      </div>
    );
  } else if (plotStyle === "lineplot") {
    plot = (
      <LinePlot
        xdata={xdata}
        ydata={ydata}
        uid={uid}
        xlabel={xSignal}
        ylabel={ylabel}
        title={plotTitle}
      />
    );
  } else {
    plot = null;
  }

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

      <div className="overflow-x-auto">
        <table className="table table-sm max-w-md">
          <tbody>
            <tr>
              <th>Horizontal:</th>
              <th>
                <SignalPicker
                  uid={uid}
                  stream="primary"
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
                  stream="primary"
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
                  stream="primary"
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
      <div className="m-2">{liveBadge}</div>

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

      {plot}
    </div>
  );
}

import { Link, useParams } from "react-router";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { useRef } from "react";
import { ErrorBoundary, getErrorMessage } from "react-error-boundary";

import { RunPlots } from "../catalog/run_plots";
import { useLatestRun } from "./latest_run";
import { BeamlineHeader } from "./header";
import { MetadataTree } from "../catalog/metadata_tree";

export const LivePlot = () => {
  const { beamlineId } = useParams<"beamlineId">();
  const { run } = useLatestRun(beamlineId);
  const plots = run == null ? <></> : <RunPlots run={run} key={run.uid} />;
  const uid = run?.metadata?.start?.uid ?? "";
  const startTime =
    run?.metadata?.start.time != null
      ? new Date(run.metadata.start.time * 1000).toLocaleString()
      : "";
  const renderNumRef = useRef(0);
  renderNumRef.current += 1;
  return (
    <>
      <BeamlineHeader title={beamlineId ?? "No beamline"} />
      <div className="m-3">
        <table className="table table-sm">
          <tbody>
            <tr>
              <th className="max-w-10">UID</th>
              <td>
                <div className="flex-1">
                  <Link to={`/catalog/${uid}`}>
                    <span className="link">
                      {run?.metadata?.start?.uid ?? ""}
                    </span>
                  </Link>
                </div>
              </td>
            </tr>
            <tr>
              <th className="max-w-10">
                <div className="w-20 flex">Exit status:</div>
              </th>
              <td>
                <div className="flex-1">
                  {run?.metadata?.stop?.exit_status ?? ""}
                </div>
              </td>
            </tr>
            <tr>
              <th className="max-w-10">
                <div className="w-20 flex">Start:</div>
              </th>
              <td>
                <div className="flex-1">{startTime}</div>
              </td>
            </tr>
          </tbody>
        </table>
	{run == null ? <></> : (
	  <MetadataTree runMetadata={run.metadata} key="root"/>
	)}
        <ErrorBoundary
          fallbackRender={({ error }) => (
            <div role="alert" className="alert alert-error alert-soft">
              <span>
                <ExclamationTriangleIcon className="size-4 inline" />
                Error! Something went wrong viewing the data for this run.
                <pre>{getErrorMessage(error)}</pre>
              </span>
            </div>
          )}
        >
          {plots}
        </ErrorBoundary>
      </div>
    </>
  );
};

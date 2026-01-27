import { Link } from "react-router";

import { RunPlots } from "../catalog/run_plots";
import { useLatestRun } from "./latest_run";

export const LivePlot = ({ beamlineId }: { beamlineId: string }) => {
  // const sendMessage, lastMessage, readyState
  const { run } = useLatestRun(beamlineId);
  const plots = run == null ? <></> : <RunPlots run={run} />;
  const uid = run?.metadata?.start?.uid ?? "";
  return (
    <>
      <h1>
        UID:{" "}
        <Link to={`/catalog/${uid}`}>{run?.metadata?.start?.uid ?? ""}</Link>
      </h1>
      {plots}
    </>
  );
};

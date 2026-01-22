import { Link } from "react-router";
import { useLatestRun } from "../tiled";
import { RunPlots } from "../catalog/run_plots";

export const LivePlot = ({ beamlineId }: { beamlineId: string }) => {
  // const sendMessage, lastMessage, readyState
  const { run } = useLatestRun({
    beamlineId: beamlineId,
  });
  const plots =
    run == null ? <></> : <RunPlots uid={run.key} plotStyle="lineplot" />;
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

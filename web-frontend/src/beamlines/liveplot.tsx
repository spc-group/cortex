import { useLatestRun } from "../tiled";
import { RunPlots } from "../catalog/run_plots";

export const LivePlot = ({ beamlineId }: { beamlineId: string }) => {
  // const sendMessage, lastMessage, readyState
  const { run } = useLatestRun({
    beamlineId: beamlineId,
  });
  const plots =
    run == null ? <></> : <RunPlots uid={run.key} plotStyle="lineplot" />;
  return (
    <>
      <h1>UID: {run?.metadata?.start?.uid ?? ""}</h1>
      {plots}
    </>
  );
};

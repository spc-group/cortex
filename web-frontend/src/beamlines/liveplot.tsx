import { useLatestRun } from "../tiled/streaming";
import { RunPlots } from "../catalog/run_plots";
import type { webSocketMessage } from "../types";

export const LivePlot = ({
  beamlineId,
}: {
  beamlineId: string;
}) => {
  // const sendMessage, lastMessage, readyState
  const { latestUID } = useLatestRun({
    beamlineId: beamlineId,
  });
  const plots =
    latestUID == null ? (
      <></>
    ) : (
      <RunPlots
        uid={latestUID}
        plotStyle="lineplot"
      />
    );
  return (
    <>
      <h1>{latestUID}</h1>
      {plots}
    </>
  );
};

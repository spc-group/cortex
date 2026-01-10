import { useLatestRun } from "../streaming";
import { RunPlots } from "../catalog/run_plots";
import type { webSocketMessage } from "../types";

export const LivePlot = ({
  beamlineId,
  webSocketHook,
}: {
  beamlineId: string;
  webSocketHook?: (a: string) => webSocketMessage;
}) => {
  // const sendMessage, lastMessage, readyState
  const { latestUID } = useLatestRun({
    webSocketHook: webSocketHook,
    beamlineId: beamlineId,
  });
  const plots =
    latestUID == null ? (
      <></>
    ) : (
      <RunPlots
        uid={latestUID}
        webSocketHook={webSocketHook}
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

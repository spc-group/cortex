import { SignalIcon, SignalSlashIcon } from "@heroicons/react/24/solid";

import { ReadyState } from "react-use-websocket";

export const LiveBadge = ({
  readyState,
}: {
  readyState: ReadyState | boolean;
}) => {
  // Decide on a badge for the connection state
  let badgeVariant;
  let badgeContent;
  switch (readyState) {
    case true:
    case ReadyState.OPEN:
      badgeVariant = "badge-success";
      badgeContent = (
        <span>
          <SignalIcon className="size-4 inline" /> Live
        </span>
      );
      break;
    case ReadyState.CONNECTING:
      badgeVariant = "badge-info";
      badgeContent = (
        <span>
          <SignalSlashIcon className="size-4 inline" /> Connecting
        </span>
      );
      break;
    default:
      badgeVariant = "badge-warning";
      badgeContent = (
        <span>
          <SignalSlashIcon className="size-4 inline" /> Disconnected
        </span>
      );
      break;
  }

  return (
    <div className={`badge badge-soft ${badgeVariant}`}>{badgeContent}</div>
  );
};

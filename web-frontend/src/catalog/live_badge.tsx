import { SignalIcon, SignalSlashIcon } from "@heroicons/react/24/solid";

import { ReadyState } from "react-use-websocket";

export const LiveBadge = ({
  readyState,
}: {
  readyState?: ReadyState | boolean;
}) => {
  // Decide on a badge for the connection state
  let badgeVariant;
  let badgeContent;
  switch (readyState) {
    case ReadyState.CONNECTING:
      badgeVariant = "badge-info";
      badgeContent = (
        <span>
          <SignalSlashIcon className="size-4 inline" /> Connecting
        </span>
      );
      break;
    case ReadyState.OPEN:
      badgeVariant = "badge-success";
      badgeContent = (
        <span>
          <SignalIcon className="size-4 inline" /> Live
        </span>
      );
      break;
    case ReadyState.CLOSING:
      badgeVariant = "badge-warning";
      badgeContent = (
        <span>
          <SignalSlashIcon className="size-4 inline" /> Closing
        </span>
      );
      break;
    case ReadyState.CLOSED:
      badgeVariant = "badge-warning";
      badgeContent = (
        <span>
          <SignalSlashIcon className="size-4 inline" /> Closed
        </span>
      );
      break;
    default:
      badgeVariant = "badge-neutral";
      badgeContent = (
        <span>
          <SignalSlashIcon className="size-4 inline" /> Unknown
        </span>
      );
      break;
  }

  return (
    <div className={`badge badge-soft ${badgeVariant}`}>{badgeContent}</div>
  );
};

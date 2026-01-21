import { useParams } from "react-router";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

import { RunPlots } from "./run_plots";
import { useMetadata } from "../tiled/use_metadata";

export function Run() {
  const { uid, plotStyle } = useParams();
  const { data: metadata } = useMetadata(uid);
  if (uid == null) {
    return (
      <div role="alert" className="alert alert-error">
        <span>
          <ExclamationTriangleIcon className="size-4 inline" />
          The uid <pre>{uid}</pre> is not available or not recognized.
        </span>
      </div>
    );
  } else {
    return (
      <>
        <h1>{metadata?.start?.scan_name}</h1>
        <h2>UID: {metadata?.start?.uid}</h2>
        <RunPlots uid={uid} plotStyle={plotStyle} />
      </>
    );
  }
}

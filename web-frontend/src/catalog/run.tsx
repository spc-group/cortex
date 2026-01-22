import { useParams } from "react-router";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

import { RunPlots } from "./run_plots";
import { useMetadata } from "../tiled";
import type { RunMetadata } from "../types";

interface RunParams {
  uid: string;
}

export function Run() {
  const { uid } = useParams<"uid">() as RunParams;
  const { metadata } = useMetadata<RunMetadata>(uid);
  const runMetadata: RunMetadata = metadata?.attributes?.metadata ?? {};
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
        <h1>{runMetadata?.start?.scan_name}</h1>
        <h2>UID: {runMetadata?.start?.uid}</h2>
        <RunPlots uid={uid} />
      </>
    );
  }
}

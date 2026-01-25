import { useParams } from "react-router";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

import { RunPlots } from "./run_plots";
import { useMetadata } from "../tiled";
import type { RunMetadata } from "./types";
import { ExitStatus } from "./exit_status";

interface RunParams {
  uid: string;
}

export function Run() {
  const { uid } = useParams<"uid">() as RunParams;
  const { metadata } = useMetadata<RunMetadata>(uid);
  let runMetadata = {
    scanName: "",
    uid: "",
    exitStatus: "",
  };
  if (metadata != null) {
    runMetadata = {
      scanName: metadata.attributes.metadata.start?.scan_name ?? "",
      uid: metadata.attributes.metadata.start.uid,
      exitStatus: metadata.attributes.metadata.stop?.exit_status ?? "",
    };
  }
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
        <h1>{runMetadata.scanName}</h1>
        <h2>UID: {runMetadata.uid}</h2>
        <div>
          Exit status: <ExitStatus status={runMetadata.exitStatus} />
        </div>
        <RunPlots uid={uid} />
      </>
    );
  }
}

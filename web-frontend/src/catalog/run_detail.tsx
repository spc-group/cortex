import { useParams } from "react-router";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

import { RunPlots } from "./run_plots";
import { useMetadata } from "../tiled";
import type { Run, RunMetadata } from "./types";
import { ExitStatus } from "./exit_status";

interface RunParams {
  uid: string;
}

export function RunDetail() {
  const { uid } = useParams<"uid">() as RunParams;
  const { metadata } = useMetadata<RunMetadata>(uid);
  let run: Run | null = null;
  if (metadata != null) {
    run = {
      metadata: metadata.attributes.metadata,
      uid: metadata.attributes.metadata.start.uid,
      path: metadata.attributes.ancestors.join("/"),
      structure_family: metadata.attributes.structure_family,
      specs: metadata.attributes.specs,
      structure: metadata.attributes.structure,
    };
  }
  // let runMetadata = {
  //   scanName: "",
  //   uid: "",
  //   exitStatus: "",
  // };
  // if (metadata != null) {
  //   runMetadata = {
  //     scanName: metadata.attributes.metadata.start?.scan_name ?? "",
  //     uid: metadata.attributes.metadata.start.uid,
  //     exitStatus: metadata.attributes.metadata.stop?.exit_status ?? "",
  //   };
  // }
  if (run == null) {
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
        <h1>{run.metadata.start?.scan_name}</h1>
        <h2>UID: {run.uid}</h2>
        <div>
          Exit status: <ExitStatus status={run.metadata?.stop?.exit_status} />
        </div>
        <RunPlots run={run} />
      </>
    );
  }
}

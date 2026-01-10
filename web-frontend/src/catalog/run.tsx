import { useParams } from "react-router";

import { RunPlots } from "./run_plots";

export function Run() {
  const { uid, plotStyle } = useParams();
  if (uid == null) {
    return (
      <div role="alert" className="alert alert-error">
        <span>No UID provided.</span>
      </div>
    );
  } else {
    return <RunPlots uid={uid} plotStyle={plotStyle} />;
  }
}

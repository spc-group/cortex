import {CalendarDaysIcon} from "@heroicons/react/24/solid";
import { NavLink, useParams} from "react-router";
import {
  useQuery,
} from '@tanstack/react-query';

import LinePlot from "./line_plot";
import { getMetadata } from "./tiled_api";


export default function Run() {
    const params = useParams();
    const uid = params.uid;
    const catalog = "scans";
    // Retrieve metadata and data keys for this dataset
    const {isLoading, data} = useQuery({
        queryFn: async () => await getMetadata({path: `${catalog}/${uid}`}),
        queryKey: ["metadata", uid],
    });
    const runMetadata = data;
    
    return (
        <div className="m-4">
          {/* Header for the run as a whole */}
          <h2 className="text-2xl/7 font-bold text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {isLoading ? <div className="skeleton"/> : runMetadata["start.scan_name"]}
          </h2>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <CalendarDaysIcon area-hidden="true" className="mr-1.5 size-5 shrink-0" />
              {isLoading ? <div className="skeleton"/> : runMetadata["uid"]}
            </div>
          </div>
          <div role="tablist" className="tabs tabs-border">
            <NavLink to="multiples" role="tab" className="tab">Multiples</NavLink>
            <NavLink to="lineplot" role="tab" className="tab tab-active">Line</NavLink>
            <NavLink to="gridplot" role="tab" className="tab">Grid</NavLink>
            <NavLink to="frames" role="tab" className="tab">Frames</NavLink>
            <NavLink to="metadata" role="tab" className="tab">Metadata</NavLink>
          </div>

          <LinePlot />

        </div>
    );
}

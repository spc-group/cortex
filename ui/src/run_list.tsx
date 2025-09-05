import { useState, useEffect } from "react";
import { PresentationChartLineIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';

import RunTable, { allColumns } from "./run_table";
import useDebounce from "./debounce";
import { getRuns } from "./tiled_api";



export function Paginator({ runCount, pageLimit=10, setPageLimit, pageOffset, setPageOffset }) {
    // Handlers for swapping pages
    const previousPage = () => {
        setPageOffset((prevOffset) => {
            const newOffset = Math.max(prevOffset - pageLimit, 0);
            return newOffset;
        });
    };
    const nextPage = () => {
        setPageOffset((prevOffset) => {
            const newOffset = Math.min(pageOffset + pageLimit, runCount - pageLimit);
            return newOffset;
        });
    };

    // Render
    const currentPage = (pageOffset / pageLimit) + 1;
    return (
        <div className="space-x-4 inline">
          <div className="join">
            <button className="join-item btn" onClick={previousPage} disabled={pageOffset == 0}>«</button>
            <button className="join-item btn">{pageOffset} - {pageOffset + pageLimit}</button>
            <button className="join-item btn" onClick={nextPage} disabled={pageOffset+pageLimit>=runCount}>»</button>
          </div>
	  <span>{ runCount } Total</span>
          <div className="inline">
            <select className="select w-20" value={pageLimit} onChange={e => setPageLimit(Number(e.target.value))}>
              <option disabled>Runs per page</option>
              <option>5</option>
              <option>10</option>
              <option>20</option>
              <option>50</option>
              <option>100</option>
            </select>
          </div>
        </div>
    );
}

export default function RunList() { 
    // State for keeping track of pagination
    const [pageLimit, setPageLimit] = useState(10);
    const [pageOffset, setPageOffset] = useState(0);
    const [runCount, setRunCount] = useState(0);

    // State for selecting which field to use for sorting
    const [sortField, setSortField] = useState(null);

    // State variables to keep track of how to filer the runs
    const columns = [...allColumns];
    for (let col of columns) {
        [ col.filter, col.setFilter ] = useState("");
	col.debouncedFilter = useDebounce(col.filter);
    }
    const filterStates = columns.map((col) => col.debouncedFilter);
    const [searchText, setSearchText] = useState("");
    const debouncedSearchText = useDebounce(searchText);
    const [standardsOnly, setStandardsOnly] = useState(false);
    const catalog = "scans";

    const loadRuns = async () => {
        // Prepare list of filters
        const filters = new Map();
        for (let col of columns) {
            if (col.filter !== "") {
                filters.set(col.field, col.filter);
            }
        }
	const theRuns = await getRuns({filters, pageLimit, pageOffset, sortField, catalog, searchText: debouncedSearchText, standardsOnly});
        return theRuns;
    };

    // Query for retrieving data for the list of runs
    const { isLoading, error, data } = useQuery({
        queryKey: ['all-runs', sortField, pageLimit, pageOffset, debouncedSearchText, standardsOnly, ...filterStates],
        queryFn: loadRuns,
    });
    let allRuns;
    if (error) {
        const modal = document.getElementById("errorModal").showModal();
    }
    if (isLoading || error) {
	allRuns = [];
    } else {
	allRuns = data.runs;
	if (runCount != data.count) {
	    setRunCount(data.count);
	}
    }
    return (
        <div className="mx-auto max-w-7xl">
          <div className="p-4">
            <Paginator runCount={runCount}
                       pageLimit={pageLimit}
                       setPageLimit={setPageLimit}
                       pageOffset={pageOffset}
                       setPageOffset={setPageOffset} />
            {/* Search box */}
            <label className="input mx-4">
              <MagnifyingGlassIcon className="size-4" />
              <input type="search"
                     value={searchText}
                     className="grow"
                     placeholder="Search (full words)…"
                     onChange={(e) => setSearchText(e.target.value)} />
            </label>
            <label className="inline">
              <input type="checkbox"
                     title="Standards checkbox"
                     checked={standardsOnly}
                     className="toggle"
                     onChange={(e) => setStandardsOnly(e.target.checked)} />
              Standards only
            </label>
            <button className="btn btn-primary float-right">
              <PresentationChartLineIcon className="size-5 inline" />Plot
            </button>
          </div>

          <div className="relative overflow-x-auto">
	    <RunTable runs={allRuns} columns={columns} sortField={sortField} setSortField={setSortField} isLoadingRuns={isLoading} catalog={catalog} />
          </div>
          {/* Error reporting */}
          <dialog id="errorModal" className="modal">
            <div className="modal-box">
              <h3 className="font-bold text-lg">{error ? error.code : null}</h3>
              <p className="py-4">{error ? error.message : null}</p>
              <div className="modal-action">
                <form method="dialog">
                  {/* if there is a button in form, it will close the modal */}
                  <button className="btn">OK</button>
                </form>
              </div>
            </div>
          </dialog>
        </div>
    );
}

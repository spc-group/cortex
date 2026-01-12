import { useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";

import RunTable from "./run_table";
import { allColumns } from "./columns";
import useDebounce from "../debounce";
import { useRuns } from "../tiled/use_runs";
import type { TableColumn, Column } from "../types";

export function Paginator({
  runCount,
  pageLimit = 10,
  setPageLimit,
  pageOffset,
  setPageOffset,
}: {
  runCount: number;
  pageLimit: number;
  setPageLimit: (value: number) => void;
  pageOffset: number;
  setPageOffset: (value: (arg0: number) => number) => void;
}) {
  // Handlers for swapping pages
  const previousPage = () => {
    setPageOffset((prevOffset: number) => {
      const newOffset = Math.max(prevOffset - pageLimit, 0);
      return newOffset;
    });
  };
  const nextPage = () => {
    setPageOffset(() => {
      const newOffset = Math.min(pageOffset + pageLimit, runCount - pageLimit);
      return newOffset;
    });
  };

  // Render
  return (
    <div className="space-x-4 inline">
      <div className="join">
        <button
          className="join-item btn"
          onClick={previousPage}
          disabled={pageOffset == 0}
        >
          «
        </button>
        <button className="join-item btn">
          {pageOffset} - {pageOffset + pageLimit}
        </button>
        <button
          className="join-item btn"
          onClick={nextPage}
          disabled={pageOffset + pageLimit >= runCount}
        >
          »
        </button>
      </div>
      <span>{runCount} Total</span>
      <div className="inline">
        <select
          className="select w-20"
          value={pageLimit}
          onChange={(e) => setPageLimit(Number(e.target.value))}
        >
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

export function RunList() {
  // State for keeping track of pagination
  const [pageLimit, setPageLimit] = useState(10);
  const [pageOffset, setPageOffset] = useState(0);
  // const [runCount, setRunCount] = useState(0);

  // State for selecting which field to use for sorting
  const [sortField, setSortField] = useState<string>("-start.time");

  // State variables to keep track of how to filter the runs
  const useFilterCol = (col: Column) => {
    const [filter, setFilter] = useState("");
    const newCol: TableColumn = {
      label: col.label,
      name: col.name,
      field: col.field,
      filter: filter,
      setFilter: setFilter,
      debouncedFilter: useDebounce(filter),
    };
    return newCol;
  };
  if (allColumns.length !== 8) {
    throw new Error("allColumns is not the expected length");
  }
  const columns = [
    useFilterCol(allColumns[0]),
    useFilterCol(allColumns[1]),
    useFilterCol(allColumns[2]),
    useFilterCol(allColumns[3]),
    useFilterCol(allColumns[4]),
    useFilterCol(allColumns[5]),
    useFilterCol(allColumns[6]),
    useFilterCol(allColumns[7]),
  ];
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText);
  const [standardsOnly, setStandardsOnly] = useState(false);

  let filterEntries = columns.map((col) => [col.field, col.debouncedFilter]);
  filterEntries = filterEntries.filter(([, text]) => text !== "");
  const filters = Object.fromEntries(filterEntries);

  // Load data from the database
  const {
    runs: allRuns,
    error,
    isLoading,
    runCount,
  } = useRuns({
    sortField: sortField,
    pageLimit: pageLimit,
    pageOffset: pageOffset,
    searchText: debouncedSearchText,
    standardsOnly: standardsOnly,
    filters: filters,
  });

  return (
    <div className="mx-auto max-w-full">
      <div className="p-4">
        <Paginator
          runCount={runCount}
          pageLimit={pageLimit}
          setPageLimit={setPageLimit}
          pageOffset={pageOffset}
          setPageOffset={setPageOffset}
        />
        {/* Search box */}
        <label className="input mx-4">
          <MagnifyingGlassIcon className="size-4" />
          <input
            type="search"
            value={searchText}
            className="grow"
            placeholder="Search (full words)…"
            onChange={(e) => setSearchText(e.target.value)}
          />
        </label>
        <label className="inline">
          <input
            type="checkbox"
            title="Standards checkbox"
            checked={standardsOnly}
            className="toggle"
            onChange={(e) => setStandardsOnly(e.target.checked)}
          />
          Standards only
        </label>
      </div>

      <div className="relative overflow-x-auto">
        <RunTable
          runs={allRuns}
          columns={columns}
          sortField={sortField}
          setSortField={setSortField}
          isLoadingRuns={isLoading}
        />
      </div>
      {/* Error reporting */}
      <dialog id="errorModal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">{String(error)}</h3>
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

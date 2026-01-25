import { useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";

import RunTable from "./run_table";
import { allColumns } from "./columns";
import useDebounce from "../debounce";
import type { TableColumn, Column } from "./types";
import type { Query } from "../tiled/types";
import { useRuns } from "./runs";
import { LiveBadge } from "./live_badge";

const DEBOUNCE_DELAY = 500;

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

export function RunList({ debounce }: { debounce?: number }) {
  const defaultDebounce = debounce ?? DEBOUNCE_DELAY;
  // State for keeping track of pagination
  const [pageLimit, setPageLimit] = useState(10);
  const [pageOffset, setPageOffset] = useState(0);

  // State for selecting which field to use for sorting
  const [sortField, setSortField] = useState<string>("-start.time");

  // State variables to keep track of how to filter the runs
  const useFilterCol = (col: Column) => {
    const [filter, setFilter] = useState("");
    // <select> columns don't need a debounce
    const debounce_ =
      (col.query?.options ?? []).length > 0 ? 0 : defaultDebounce;
    const newCol: TableColumn = {
      label: col.label,
      name: col.name,
      query: col.query,
      field: col.field,
      filter: filter,
      setFilter: setFilter,
      debouncedFilter: useDebounce(filter, debounce_),
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
  const debouncedSearchText = useDebounce(searchText, defaultDebounce);
  const [standardsOnly, setStandardsOnly] = useState(false);
  const [beforeDate, setBeforeDate] = useState("");
  const [afterDate, setAfterDate] = useState("");

  let filters = columns.map((col): Query => {
    // Convert the column state to a Tiled query
    return {
      type: col?.query?.type ?? "",
      value: col.debouncedFilter,
      key: col?.query?.key,
      operator: col?.query?.operator,
      case_sensitive: col?.query?.case_sensitive,
    };
  });
  // Remove empty filters
  filters = filters.filter((query) => query.value);
  // Add global filters
  if (standardsOnly) {
    filters.push({
      type: "eq",
      key: "start.is_standard",
      value: "true",
    });
  }
  if (debouncedSearchText !== "") {
    filters.push({
      type: "fulltext",
      value: debouncedSearchText,
    });
  }
  if (beforeDate !== "") {
    const timestamp = new Date(beforeDate).getTime() / 1000;
    filters.push({
      type: "comparison",
      key: "start.time",
      value: timestamp,
      operator: "lt",
    });
  }
  if (afterDate !== "") {
    const timestamp = new Date(afterDate).getTime() / 1000;
    filters.push({
      type: "comparison",
      key: "start.time",
      value: timestamp,
      operator: "ge",
    });
  }

  // Load data from the database
  const {
    runs: allRuns,
    isLoading,
    count: runCount,
    readyState,
  } = useRuns({
    sortField: sortField,
    pageLimit: pageLimit,
    pageOffset: pageOffset,
    filters: filters,
  });

  return (
    <div className="mx-auto max-w-full">
      <div className="h-10 p-3 space-x-3">
        <LiveBadge readyState={readyState} />
        {isLoading ? (
          <div className="badge badge-soft badge-info s-3">Loading…</div>
        ) : (
          <></>
        )}
      </div>
      <div className="px-4 py-2 space-x-4">
        {/* Search box */}
        <label className="input">
          <MagnifyingGlassIcon className="size-4" />
          <input
            type="search"
            value={searchText}
            className="grow"
            placeholder="Search (full words)…"
            onChange={(e) => setSearchText(e.target.value)}
          />
        </label>
        <label className="input">
          <span className="label">Before:</span>
          <input
            type="datetime-local"
            className="input mx-2"
            value={beforeDate}
            onChange={(e) => setBeforeDate(e.target.value)}
            title="Only include runs started before a given time."
          />
        </label>
        <label className="input">
          <span className="label">After:</span>
          <input
            type="datetime-local"
            className="input mx-2"
            value={afterDate}
            onChange={(e) => setAfterDate(e.target.value)}
            title="Only include runs started on or after a given time."
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
        <Paginator
          runCount={runCount}
          pageLimit={pageLimit}
          setPageLimit={setPageLimit}
          pageOffset={pageOffset}
          setPageOffset={setPageOffset}
        />
      </div>

      <div className="relative overflow-x-auto">
        <RunTable
          runs={allRuns}
          columns={columns}
          sortField={sortField}
          setSortField={setSortField}
        />
      </div>
    </div>
  );
}

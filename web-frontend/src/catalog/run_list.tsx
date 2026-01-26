import { useState } from "react";
import { useSearchParams } from "react-router";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";

import RunTable from "./run_table";
import { allColumns } from "./columns";
import useDebounce from "../debounce";
import type { TableColumn, Column } from "./types";
import type { Query } from "../tiled/types";
import { useRuns } from "./runs";
import { LiveBadge } from "./live_badge";
import { useSearchParam } from "./search_param";

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
  setPageOffset: (value: number) => void;
}) {
  // Handlers for swapping pages
  const previousPage = () => {
    const newOffset = Math.max(pageOffset - pageLimit, 0);
    setPageOffset(newOffset);
  };
  const nextPage = () => {
    const newOffset = Math.min(pageOffset + pageLimit, runCount - pageLimit);
    setPageOffset(newOffset);
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
          onChange={(e) => setPageLimit(Number(e.currentTarget.value))}
        >
          <option disabled>Runs per page</option>
          <option>1</option>
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

  const setSearchParams = useSearchParams()[1];

  // State for keeping track of pagination
  const [pageLimit, setPageLimit] = useSearchParam<number>("pageLimit", 10);
  const [pageOffset, setPageOffset] = useSearchParam<number>("pageOffset", 0);

  // State for selecting which field to use for sorting
  const [sortField, setSortField] = useSearchParam<string>(
    "sortField",
    "-start.time",
  );

  // State variables to keep track of how to filter the runs
  const useFilterCol = (col: Column) => {
    const [filter, setFilter] = useSearchParam<string>(col.name, "");
    const [rawFilter, setRawFilter] = useState<string>(filter);
    // <select> columns don't need a debounce
    const debounce_ =
      (col.query?.options ?? []).length > 0 ? 0 : defaultDebounce;
    useDebounce(rawFilter, debounce_, setFilter);
    const newCol: TableColumn = {
      label: col.label,
      name: col.name,
      query: col.query,
      field: col.field,
      filter: rawFilter,
      setFilter: setRawFilter,
      debouncedFilter: filter,
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

  // const beforeDate = searchParams.get("beforeDate") ?? "";
  // const afterDate = searchParams.get("afterDate") ?? "";
  const [beforeDate, setBeforeDate] = useSearchParam<string>("beforeDate", "");
  const [afterDate, setAfterDate] = useSearchParam<string>("afterDate", "");
  const [standardsOnly, setStandardsOnly] = useSearchParam<boolean>(
    "standardsOnly",
    false,
  );
  // Debounced parameters get handled differently
  const [rawSearchText, setRawSearchText] = useState<string>("");
  const [fullText, setFullText] = useSearchParam<string>("fullText", "");
  useDebounce(rawSearchText, defaultDebounce, setFullText);
  // if (debouncedSearchText != searchParams.get("searchText") ?? "") {
  //   setSearchState("searchText")(debouncedSearchText);
  // }

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
  if (fullText !== "") {
    filters.push({
      type: "fulltext",
      value: fullText,
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
  if (afterDate !== "" && afterDate != null) {
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
            value={rawSearchText}
            className="grow"
            placeholder="Search (full words)…"
            onChange={(e) => {
              setRawSearchText(e.currentTarget.value);
            }}
          />
        </label>
        <label className="input">
          <span className="label">Before:</span>
          <input
            type="datetime-local"
            className="input mx-2"
            value={beforeDate}
            onChange={(e) => setBeforeDate(e.currentTarget.value)}
            title="Only include runs started before a given time."
          />
        </label>
        <label className="input">
          <span className="label">After:</span>
          <input
            type="datetime-local"
            className="input mx-2"
            value={afterDate}
            onChange={(e) => setAfterDate(e.currentTarget.value)}
            title="Only include runs started on or after a given time."
          />
        </label>
        <label className="inline">
          <input
            type="checkbox"
            title="Standards checkbox"
            checked={standardsOnly}
            className="toggle"
            onChange={(e) => setStandardsOnly(e.currentTarget.checked)}
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
        <a className={"link"} onClick={() => setSearchParams({})}>
          Reset all
        </a>
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

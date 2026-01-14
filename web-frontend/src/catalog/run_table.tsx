import {
  CheckIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/solid";
import { BeakerIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import type { ChangeEvent } from "react";

import { Link } from "react-router";
import { tiledUri, getApiInfo } from "../tiled/tiled_api";
import type { TableColumn, BlueskySpec, Run } from "../types";

const SortIcon = ({
  fieldName,
  sortField,
}: {
  fieldName: string;
  sortField: string;
}) => {
  if (sortField == fieldName) {
    return <ArrowDownIcon title="Sort ascending" className="size-4 inline" />;
  } else if (sortField == "-" + fieldName) {
    return <ArrowUpIcon title="Sort descending" className="size-4 inline" />;
  } else {
    return <></>;
  }
};

export const SkeletonRow = ({ numColumns }: { numColumns: number }) => {
  return (
    <tr>
      {/* Empty columns for icons (don't need skeletons) */}
      <td></td>
      <td></td>
      <td></td>
      {[...Array(numColumns).keys()].map((idx) => {
        return (
          <td key={`skeleton-row-${idx}`}>
            <div className="skeleton h-6 w-24"></div>
          </td>
        );
      })}
    </tr>
  );
};

export default function RunTable({
  runs = [],
  selectRun,
  sortField,
  setSortField,
  columns = [],
  isLoadingRuns = false,
}: {
  runs?: Run[];
  // *selectRun* isn't doing much until we implement select checkboxes
  selectRun?: (uid: string, isSelected: boolean) => void;
  sortField: string;
  setSortField: (val: (arg0: string) => string) => void;
  columns?: TableColumn[];
  isLoadingRuns?: boolean;
}) {
  // A table for displaying a sequence of runs to the user
  // Includes widgets for sorting, etc
  // Curried version of setSortField for each column
  const sortFieldParser = (field: string) => {
    return () => {
      setSortField((prevField: string) => {
        if (prevField == field) {
          // Reverse sort order
          return "-" + field;
        } else if (prevField == "-" + field) {
          // Turn off sorting
          return "";
        } else {
          // Forward sort order
          return field;
        }
      });
    };
  };
  // Render
  return (
    <table className="table table-pin-rows w-full text-left rtl:text-right text-gray-500 dark:text-gray-400">
      <thead className="text-gray-700 bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
        <tr>
          <th className="text-center">
            <CheckIcon className="inline size-6" />
          </th>
          <th className="text-center">
            <ArrowDownTrayIcon
              className="size-6 inline"
              title="Download icon"
            />
          </th>
          <th className="text-center">
            <BeakerIcon className="size-6 inline" title="Scientific scan" />
          </th>
          {columns.map((col: TableColumn) => {
            return (
              <th key={"column-" + col.name}>
                <div onClick={sortFieldParser(col.field)}>
                  {col.label}{" "}
                  <SortIcon fieldName={col.field} sortField={sortField} />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder={"Filter…"}
                    title={"Filter by " + col.label}
                    className="input input-xs input-ghost align-top w-full max-w-xs"
                    value={col.filter}
                    disabled={col.filter === null}
                    onChange={(e) => col.setFilter(e.target.value)}
                  />
                </div>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {isLoadingRuns
          ? // Show a skeleton table while we wait for the API
            [...Array(10).keys()].map((idx) => (
              <SkeletonRow
                key={`skeleton-row-${idx}`}
                numColumns={columns.length}
              />
            ))
          : // Show actual list of runs in the table
            runs.map((run) => (
              <Row
                run={run}
                key={run.key}
                onSelect={selectRun}
                columns={columns}
              />
            ))}
      </tbody>
    </table>
  );
}

// A row in the run table for a given run
export function Row({
  run,
  onSelect,
  columns,
  apiUri = tiledUri,
}: {
  run: Run;
  onSelect?: (uid: string, isSelected: boolean) => void;
  columns: TableColumn[];
  apiUri?: string;
}) {
  // Handler for selecting a run
  const handleCheckboxChecked = (event: ChangeEvent<HTMLInputElement>) => {
    if (onSelect !== undefined) {
      onSelect(run.metadata.start.uid, event.target.checked);
    }
  };

  // Decide which export formats we support
  const { isLoading, error, data } = useQuery({
    queryKey: ["api-info"],
    queryFn: async () => {
      return await getApiInfo();
    },
  });
  const exportFormats = [];
  if (!isLoading && !error) {
    const defaultFilename = (aliases: string[]) => {
      let fragments = [
        run?.metadata?.start?.uid == null
          ? null
          : run.metadata.start.uid.split("-")[0],
        run.metadata.start.sample_name,
        run.metadata.start.scan_name,
        run.metadata.start.plan_name,
      ];
      fragments = fragments.filter((frag) => frag);
      const suffix = aliases.length > 0 ? `.${aliases[0]}` : "";
      return `${fragments.join("-")}${suffix}`;
    };
    // Add formats from structure family
    for (const mimeType of data.formats[run.structure_family] || []) {
      const aliases = data.aliases[run.structure_family][mimeType] || [];
      exportFormats.push({
        mimeType: mimeType,
        label: [...aliases, mimeType][0],
        defaultFilename: defaultFilename(aliases),
      });
    }
    // Add formats from specs
    for (const spec of run.specs || []) {
      for (const mimeType of data.formats[spec.name] || []) {
        const aliases = data.aliases[spec.name][mimeType] || [];
        exportFormats.push({
          mimeType: mimeType,
          label: [...aliases, mimeType][0],
          defaultFilename: defaultFilename(aliases),
        });
      }
    }
  }
  // Prepare additional data
  const uid = run.metadata.start.uid;
  const runUri = `${apiUri}container/full/${run.key}`;
  const specs = run.specs === undefined ? [] : run.specs;
  const specNames = specs.map((spec: BlueskySpec) => spec.name);
  const dataSpecs = ["XASRun"];
  const isDataRun =
    specNames.filter((thisSpec: string) => dataSpecs.includes(thisSpec))
      .length > 0;

  // Prepare the column data
  const columnValues = {
    "start.scan_name": run.metadata.start.scan_name,
    "start.uid": run.metadata.start.uid,
    "start.sample_name": run.metadata.start.sample_name,
    "start.plan_name": run.metadata.start.plan_name,
    "stop.exit_status": run.metadata.stop?.exit_status ?? "",
    "start.proposal": run.metadata.start.proposal_id,
    "start.esaf": run.metadata.start.esaf_id,
    "start.time":
      run.metadata.start.time != null ? new Date(run.metadata.start.time) : "",
  };

  return (
    <tr>
      <td>
        <input
          type="checkbox"
          id="checkbox"
          className="checkbox"
          onChange={handleCheckboxChecked}
        />
      </td>
      <td>
        <div className="dropdown dropdown-hover dropdown-right">
          <div tabIndex={0} role="button" className="btn btn-ghost m-1 btn-sm">
            <ArrowDownTrayIcon
              className="inline size-4"
              title="Download icon"
            />
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
          >
            {exportFormats.map((format) => {
              return (
                <li key={`${run.metadata.start.uid}-${format.mimeType}`}>
                  <a
                    href={`${runUri}?format=${format.mimeType}`}
                    download={format.defaultFilename}
                  >
                    {format.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </td>

      <td>
        {!isDataRun ? (
          ""
        ) : (
          <BeakerIcon title="Data run icon" className="size-4" />
        )}
      </td>
      {columns.map((col: TableColumn) => {
        // @ts-expect-error: no implicit any
        const value = columnValues[col.field];
        let text: string;
        if (value instanceof Date) {
          text = value.toISOString().split("T").join(" ");
        } else {
          text = String(value ?? "");
        }
        return (
          <td key={uid + col.name}>
            <Link to={uid + "/lineplot"}>{text ?? ""}</Link>
          </td>
        );
      })}
    </tr>
  );
}

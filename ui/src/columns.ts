import type { Column } from "./types";

export const allColumns: Column[] = [
  {
    label: "Plan",
    name: "plan",
    field: "start.plan_name",
    setFilter: (state: string) => {return state},
  },
  {
    label: "Scan",
    name: "scan",
    field: "start.scan_name",
    setFilter: (state: string) => {return state},
  },
  {
    label: "Sample",
    name: "sample",
    field: "start.sample_name",
    setFilter: (state: string) => {return state},
  },
  {
    label: "Exit Status",
    name: "exit-status",
    field: "stop.exit_status",
    setFilter: (state: string) => {return state},
  },
  {
 label: "Start",
    name: "start-time",
    field: "start.time",
    filter: null,
    setFilter: (state: string) => {return state},
  },
  {
    label: "UID",
    name: "uid",
    field: "start.uid",
    setFilter: (state: string) => {return state},
  },
  {
    label: "Proposal",
    name: "proposal",
    field: "start.proposal",
    setFilter: (state: string) => {return state},
  },
  {
    label: "ESAF",
    name: "esaf",
    field: "start.esaf",
    setFilter: (state: string) => {return state},
  },
];

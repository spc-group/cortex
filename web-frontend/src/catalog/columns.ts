import type { Column } from "./types";

export const allColumns: Column[] = [
  {
    label: "Plan",
    name: "plan",
    field: "start.plan_name",
    query: {
      type: "contains",
      key: "start.plan_name",
    },
  },
  {
    label: "Scan",
    name: "scan",
    field: "start.scan_name",
    query: {
      type: "contains",
      key: "start.scan_name",
    },
  },
  {
    label: "Sample",
    name: "sample",
    field: "start.sample_name",
    query: {
      type: "contains",
      key: "start.sample_name",
    },
  },
  {
    label: "Exit Status",
    name: "exit-status",
    field: "stop.exit_status",
    query: {
      type: "eq",
      key: "stop.exit_status",
      options: ["success", "abort", "failed"],
    },
  },
  {
    label: "Start",
    name: "start-time",
    field: "start.time",
    query: null,
    // query: {
    //   type: "comparison",
    //   key: "start.time",
    //   operator: "ge",
    // },
  },
  {
    label: "UID",
    name: "uid",
    field: "start.uid",
    query: {
      type: "contains",
      key: "start.uid",
    },
  },
  {
    label: "Proposal",
    name: "proposal",
    field: "start.proposal",
    query: {
      type: "eq",
      key: "start.proposal",
    },
  },
  {
    label: "ESAF",
    name: "esaf",
    field: "start.esaf",
    query: {
      type: "eq",
      key: "start.esaf",
    },
  },
];

import type { Column } from "./types";

export const allColumns: Column[] = [
  {
    label: "Plan",
    name: "planName",
    field: "start.plan_name",
    query: {
      type: "contains",
      key: "start.plan_name",
    },
  },
  {
    label: "Scan",
    name: "scanName",
    field: "start.scan_name",
    query: {
      type: "contains",
      key: "start.scan_name",
    },
  },
  {
    label: "Sample",
    name: "sampleName",
    field: "start.sample_name",
    query: {
      type: "contains",
      key: "start.sample_name",
    },
  },
  {
    label: "Exit Status",
    name: "exitStatus",
    field: "stop.exit_status",
    query: {
      type: "eq",
      key: "stop.exit_status",
      options: ["success", "abort", "failed"],
    },
  },
  {
    label: "Start",
    name: "startTime",
    field: "start.time",
    query: null,
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
    name: "proposalId",
    field: "start.proposal_id",
    query: {
      type: "eq",
      key: "start.proposal_id",
    },
  },
  {
    label: "ESAF",
    name: "esafId",
    field: "start.esaf_id",
    query: {
      type: "eq",
      key: "start.esaf_id",
    },
  },
];

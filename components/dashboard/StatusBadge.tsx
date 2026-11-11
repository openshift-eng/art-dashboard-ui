import React from "react";
import { Badge } from "../ui/badge";

type StatusVariant = "success" | "info" | "destructive" | "warning" | "default";

const STATUS_MAP: Record<string, StatusVariant> = {
  Approved: "success",
  SHIPPED_LIVE: "success",
  "Shipped live": "success",
  Succeeded: "success",
  Partial: "warning",
  "Partially shipped": "warning",
  "Partially staged": "warning",
  "In review": "warning",
  "Stage skipped": "warning",
  "Awaiting review": "warning",
  Failed: "destructive",
  failed: "destructive",
  running: "info",
  success: "success",
  QE: "success",
  CLOSED: "success",
  VERIFIED: "success",
  Requested: "info",
  ON_QA: "info",
  REL_PREP: "info",
  Staged: "warning",
  Pending: "default",
  NEW_FILES: "warning",
  MODIFIED: "warning",
  "Not Requested": "default",
  "Not Approved": "default",
};

function getVariant(status: string): StatusVariant {
  return STATUS_MAP[status] || "default";
}

interface StatusBadgeProps {
  status: string;
  count?: number;
  className?: string;
}

export function StatusBadge({ status, count, className }: StatusBadgeProps) {
  const label = count !== undefined ? `${status} ${count}` : status;
  return (
    <Badge variant={getVariant(status)} className={className}>
      {label}
    </Badge>
  );
}

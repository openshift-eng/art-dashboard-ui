import React from "react";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";

interface PipelineStatusProps {
  status: Record<string, boolean>;
  loading?: boolean;
}

const PIPELINE_STEPS = [
  { key: "gen_assembly", label: "Gen Assembly" },
  { key: "prepare_release", label: "Prepare Release" },
  { key: "build_sync", label: "Build Sync" },
  { key: "promoted", label: "Promoted" },
];

export function PipelineStatus({ status, loading }: PipelineStatusProps) {
  if (loading) {
    return (
      <div className="mb-4 flex items-center gap-2">
        {PIPELINE_STEPS.map((step) => (
          <Skeleton key={step.key} className="h-7 w-28 rounded" />
        ))}
      </div>
    );
  }

  if (!status || Object.keys(status).length === 0) {
    return null;
  }

  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="mr-1 text-sm text-muted-foreground">Pipeline:</span>
      {PIPELINE_STEPS.map((step, idx) => {
        const done = status[step.key] === true;
        return (
          <React.Fragment key={step.key}>
            {idx > 0 && (
              <svg
                className={`h-3 w-3 flex-shrink-0 ${done || status[PIPELINE_STEPS[idx - 1]?.key] ? "text-muted-foreground" : "text-muted-foreground/30"}`}
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <Badge variant={done ? "success" : "default"}>
              {done && (
                <svg className="mr-1 h-3 w-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {step.label}
            </Badge>
          </React.Fragment>
        );
      })}
    </div>
  );
}

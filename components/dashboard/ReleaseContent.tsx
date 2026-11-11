import React, { useState } from "react";
import { AlertTriangle, Clock3, ExternalLink, RefreshCw } from "lucide-react";
import { AdvisoryTable } from "./AdvisoryTable";
import { StatusBadge } from "./StatusBadge";
import { Skeleton } from "../ui/skeleton";
import { useDashboardResource } from "../api_calls/product_calls";
import {
  Product,
  Release,
  ReleaseDetail,
  Shipment,
  EnvironmentStatus,
  environmentSummary,
  externalUrl,
} from "../../lib/releases";

export function External({
  href,
  children,
  className = "",
  label,
}: {
  href?: string;
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  const url = externalUrl(href);
  return url ? (
    <a
      href={url}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-accent hover:underline ${className}`}
    >
      {children}
      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    </a>
  ) : (
    <span>{children}</span>
  );
}

export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div
      role="alert"
      className="my-4 flex flex-wrap items-center gap-3 rounded-md bg-destructive/10 p-4 text-sm text-destructive"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 break-words">{message}</span>
      <button
        onClick={retry}
        className="inline-flex items-center gap-1.5 rounded border border-destructive/30 px-3 py-1.5"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        Retry
      </button>
    </div>
  );
}

export function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading release data"
      className="space-y-5 py-4"
    >
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

function EnvironmentCell({ environment }: { environment?: EnvironmentStatus }) {
  if (!environment)
    return <span className="text-muted-foreground">Unknown</span>;
  return (
    <External href={environment.advisory_url || environment.pipeline_url}>
      <StatusBadge
        status={environment.status}
        className="whitespace-nowrap text-xs"
      />
    </External>
  );
}

function Shipments({ shipments }: { shipments: Shipment[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" aria-label="Shipment status">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground">
            {[
              "Shipment",
              "Target application",
              "Advisory",
              "Stage",
              "Production",
              "MR",
            ].map((label) => (
              <th
                key={label}
                className="whitespace-nowrap px-3 py-3 font-medium first:pl-0"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shipments.map((shipment) => (
            <tr key={shipment.id} className="border-b border-border/70">
              <td className="py-4 pr-3 align-top">
                <div className="font-medium">
                  {shipment.kind === "fbc"
                    ? "FBC"
                    : shipment.kind.charAt(0).toUpperCase() +
                      shipment.kind.slice(1)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Konflux
                  {shipment.target_environment === "stage"
                    ? " · Stage only"
                    : ""}
                </div>
              </td>
              {shipment.error ? (
                <td colSpan={5} className="px-3 py-4 text-destructive">
                  {shipment.error}
                </td>
              ) : (
                <>
                  <td className="max-w-[250px] break-words px-3 py-4 font-mono text-xs">
                    {shipment.application || "—"}
                    <div className="mt-1 font-sans text-xs text-muted-foreground">
                      {shipment.synopsis}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <span className="font-mono">{shipment.live_id || "—"}</span>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {shipment.advisory_required === false
                        ? "Not applicable"
                        : shipment.type || "Not assigned"}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <EnvironmentCell environment={shipment.stage} />
                  </td>
                  <td className="px-3 py-4">
                    <EnvironmentCell environment={shipment.prod} />
                  </td>
                  <td className="px-3 py-4">
                    <External
                      href={shipment.diff_url}
                      label={`Shipment file for ${shipment.application || shipment.kind}`}
                    >
                      File
                    </External>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Approvals({ approvals }: { approvals: ReleaseDetail["approvals"] }) {
  const rules = Object.entries(approvals);
  if (!rules.length)
    return (
      <p className="py-8 text-sm text-muted-foreground">
        No approval rules were returned for this shipment MR.
      </p>
    );
  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">
        Approvals apply to the shipment MR.
      </p>
      {rules.map(([name, rule]) => (
        <div
          key={name}
          className="flex items-center justify-between gap-4 border-b border-border py-4"
        >
          <div>
            <div className="text-sm font-medium">
              {name}
              {rule.required === false && (
                <span className="ml-2 font-normal text-muted-foreground">
                  Optional
                </span>
              )}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {rule.approved_by ||
                (rule.approved
                  ? "Reviewer not reported by GitLab"
                  : "No approval recorded")}
            </div>
          </div>
          <StatusBadge
            status={rule.approved ? "Approved" : "Awaiting review"}
            className="whitespace-nowrap text-xs"
          />
        </div>
      ))}
    </div>
  );
}

function LegacyAdvisories({ release }: { release: Release }) {
  const entries = Object.entries(release.advisories || {}).filter(
    ([, id]) => id > 0,
  );
  const ids = entries.map(([, id]) => id).join(",");
  const resource = useDashboardResource<{ data: Record<string, any> }>(
    ids ? `errata/advisory/batch/?ids=${ids}` : null,
  );
  if (!ids) return null;
  const rows = entries.map(([kind, id]) => {
    const entry = resource.data?.data?.[id];
    const details = entry?.data?.advisory_details?.[0];
    if (!details)
      return {
        advisory_type: kind,
        errata_id: id,
        error: entry?.message || "Advisory details unavailable",
      };
    return {
      advisory_type: kind,
      errata_id: id,
      advisory_type_main: details.advisory_type,
      status: details.status,
      publish_date: details.publish_date,
      synopsis: details.synopsis,
      doc_complete: details.doc_complete,
      doc_reviewer_realname: details.doc_reviewer_details?.realname,
      bug_summary: entry.data.bug_summary,
    };
  });
  return (
    <section aria-label="ErrataTool advisories" className="mt-8">
      <h2 className="mb-4 text-sm font-medium">ErrataTool advisories</h2>
      {resource.error ? (
        <ErrorState message={resource.error} retry={resource.retry} />
      ) : (
        <AdvisoryTable data={rows} loading={resource.loading} />
      )}
    </section>
  );
}

export default function ReleaseContent({
  product,
  group,
  release,
  gaVersion,
}: {
  product: Product;
  group: string;
  release: Release;
  gaVersion?: string;
}) {
  const [tab, setTab] = useState("shipments");
  const resource = useDashboardResource<ReleaseDetail>(
    `products/${product.id}/release/?group=${encodeURIComponent(group)}&assembly=${encodeURIComponent(release.version)}`,
  );
  const detail = resource.data;
  const shipments = detail?.shipments || [];
  const docs = detail?.approvals?.Docs;
  const stage = environmentSummary(shipments, "stage");
  const production = environmentSummary(shipments, "prod");
  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {product.name} {release.version}
            </h1>
            {product.id === "openshift" &&
              group === `openshift-${gaVersion}` && (
                <span className="rounded bg-success/10 px-2 py-1 text-xs text-success">
                  GA
                </span>
              )}
            {detail?.status && (
              <StatusBadge
                status={
                  detail.status === "SHIPPED_LIVE"
                    ? "Shipped live"
                    : detail.status
                }
                className="text-xs"
              />
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {product.description}
            {release.release_date ? ` · ${release.release_date}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          {release.shipment_url && (
            <External
              href={release.shipment_url}
              className="rounded-md border border-border px-3 py-1.5"
            >
              Shipment MR
            </External>
          )}
          {release.jira && (
            <External
              href={`https://issues.redhat.com/browse/${encodeURIComponent(release.jira)}`}
            >
              {release.jira}
            </External>
          )}
        </div>
      </div>
      {product.release_streams && release.version !== "current" && (
        <div className="mb-6 flex flex-wrap gap-4 text-xs">
          <span className="text-muted-foreground">Release streams</span>
          {["amd64", "s390x", "ppc64le", "arm64"].map((arch) => (
            <External
              key={arch}
              href={`https://${arch}.ocp.releases.ci.openshift.org/releasestream/${arch === "amd64" ? "4-stable" : `4-stable-${arch}`}/release/${release.version}`}
            >
              {arch}
            </External>
          ))}
        </div>
      )}
      {resource.loading && <Loading />}
      {resource.error && (
        <ErrorState message={resource.error} retry={resource.retry} />
      )}
      {detail && release.shipment_url && (
        <>
          <div
            aria-label="Release lifecycle"
            className="mb-6 grid gap-4 sm:grid-cols-3"
          >
            {[
              {
                label: "Preparation",
                value: "Shipment MR created",
                complete: true,
              },
              {
                label: "Staging",
                value: stage,
                complete: stage === "Succeeded" || stage === "Skipped",
              },
              {
                label: "Production",
                value:
                  production === "Succeeded"
                    ? "Published successfully"
                    : production,
                complete: production === "Succeeded",
              },
            ].map((step) => (
              <div
                key={step.label}
                className={`border-t-2 pt-3 ${step.complete ? "border-success" : "border-border"}`}
              >
                <div className="text-sm font-medium">{step.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {step.value}
                </div>
              </div>
            ))}
          </div>
          {docs &&
            docs.required !== false &&
            !docs.approved &&
            production !== "Succeeded" && (
              <div className="mb-5 flex items-center gap-2 rounded-md bg-warning/10 px-4 py-3 text-sm text-warning">
                <Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" />
                Docs approval is pending.
              </div>
            )}
          <div
            className="mb-5 flex gap-6 border-b border-border"
            role="tablist"
            aria-label="Release details"
          >
            {["shipments", "approvals"].map((value) => (
              <button
                key={value}
                id={`release-tab-${value}`}
                role="tab"
                aria-controls="release-panel"
                aria-selected={tab === value}
                onClick={() => setTab(value)}
                className={`border-b-2 py-3 text-sm capitalize ${tab === value ? "border-accent text-accent" : "border-transparent text-muted-foreground"}`}
              >
                {value}
              </button>
            ))}
          </div>
          <div
            role="tabpanel"
            id="release-panel"
            aria-labelledby={`release-tab-${tab}`}
          >
            {tab === "shipments" ? (
              <>
                <Shipments shipments={shipments} />
                <div className="mt-4 flex flex-wrap justify-between gap-3 text-xs text-muted-foreground">
                  <span>
                    {shipments.length} shipments · Each FBC target appears
                    separately
                  </span>
                  {detail.pipeline?.status && (
                    <External href={detail.pipeline.url}>
                      MR pipeline: {detail.pipeline.status}
                    </External>
                  )}
                </div>
              </>
            ) : (
              <Approvals approvals={detail.approvals} />
            )}
          </div>
        </>
      )}
      {!resource.loading && !resource.error && !release.shipment_url && (
        <p className="my-6 text-sm text-muted-foreground">
          No shipment MR is recorded for this release.
        </p>
      )}
      <LegacyAdvisories release={release} />
    </>
  );
}

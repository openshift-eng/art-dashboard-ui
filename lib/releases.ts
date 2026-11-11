export interface Product {
  id: string;
  name: string;
  description: string;
  release_streams: boolean;
}

export interface Release {
  version: string;
  release_date?: string;
  jira?: string;
  shipment_url?: string;
  advisories: Record<string, number>;
}

export interface EnvironmentStatus {
  status: string;
  advisory_url?: string;
  pipeline_url?: string;
}

export interface Shipment {
  id: string;
  kind: string;
  application?: string;
  target_environment?: string;
  advisory_required?: boolean;
  live_id?: number;
  type?: string;
  synopsis?: string;
  diff_url?: string;
  stage?: EnvironmentStatus;
  prod?: EnvironmentStatus;
  error?: string;
}

export interface ReleaseDetail extends Release {
  product: string;
  group: string;
  status?: string;
  mr_state?: string;
  shipments: Shipment[];
  approvals: Record<
    string,
    { approved: boolean; approved_by: string; required?: boolean }
  >;
  pipeline?: { status?: string; url?: string };
}

export interface ProductOverview {
  product: Product;
  group?: string;
  release?: ReleaseDetail;
  error?: string;
}

export function releasePath(product: string, group?: string, version?: string) {
  return `/dashboard/products/${[product, group, version].filter(Boolean).map(encodeURIComponent).join("/")}`;
}

export function environmentSummary(
  shipments: Shipment[],
  environment: "stage" | "prod",
) {
  if (!shipments.length || shipments.some((s) => s.error)) return "Unknown";
  const states = shipments
    .map((s) => s[environment]?.status || "Unknown")
    .filter((s) => s !== "Not configured");
  if (!states.length) return "Not configured";
  if (states.every((s) => s === "Skipped")) return "Skipped";
  if (states.every((s) => s === "Succeeded" || s === "Skipped"))
    return "Succeeded";
  if (states.some((s) => s === "Succeeded")) return "Partial";
  if (states.some((s) => s === "Unknown")) return "Unknown";
  return "Not started";
}

export function externalUrl(value?: string) {
  try {
    const url = new URL(value || "");
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

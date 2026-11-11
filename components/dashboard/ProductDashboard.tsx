import React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowUpRight } from "lucide-react";
import { DashboardLayout } from "./DashboardLayout";
import { StatusBadge } from "./StatusBadge";
import ReleaseContent, { ErrorState, Loading } from "./ReleaseContent";
import { useDashboardResource } from "../api_calls/product_calls";
import {
  Product,
  ProductOverview,
  Release,
  environmentSummary,
  releasePath,
} from "../../lib/releases";

function Overview() {
  const resource =
    useDashboardResource<ProductOverview[]>("products/overview/");
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">All products</h1>
      <p className="mb-7 mt-2 text-sm text-muted-foreground">
        Latest recorded release in the newest group with release entries.
      </p>
      {resource.loading && <Loading />}
      {resource.error && (
        <ErrorState message={resource.error} retry={resource.retry} />
      )}
      {resource.data && (
        <div className="overflow-x-auto">
          <table
            className="w-full text-left text-sm"
            aria-label="Product release overview"
          >
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                {["Product / group", "Release", "Stage", "Production"].map(
                  (label) => (
                    <th
                      key={label}
                      className="px-4 py-3 font-medium first:pl-0"
                    >
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {resource.data.map((row) => (
                <tr key={row.product.id} className="border-b border-border">
                  <td className="py-5 pr-4">
                    <Link
                      className="inline-flex items-center gap-1 text-accent"
                      href={releasePath(
                        row.product.id,
                        row.group,
                        row.release?.version,
                      )}
                    >
                      {row.product.name}
                      <ArrowUpRight
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    </Link>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">
                      {row.group || row.product.description}
                    </div>
                  </td>
                  {row.error ? (
                    <td
                      colSpan={3}
                      className="px-4 py-5 text-sm text-destructive"
                    >
                      Release data unavailable.{" "}
                      <button onClick={resource.retry} className="underline">
                        Retry
                      </button>
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-5 font-mono">
                        {row.release?.version || "No releases"}
                      </td>
                      <td className="px-4 py-5">
                        <StatusBadge
                          status={
                            row.release?.shipment_url
                              ? environmentSummary(
                                  row.release.shipments,
                                  "stage",
                                )
                              : row.release ? "No shipment MR" : "—"
                          }
                          className="whitespace-nowrap text-xs"
                        />
                      </td>
                      <td className="px-4 py-5">
                        <StatusBadge
                          status={
                            row.release?.shipment_url
                              ? environmentSummary(
                                  row.release.shipments,
                                  "prod",
                                )
                              : row.release ? "No shipment MR" : "—"
                          }
                          className="whitespace-nowrap text-xs"
                        />
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function ProductDashboard({
  legacy = false,
}: {
  legacy?: boolean;
}) {
  const router = useRouter();
  const selection = Array.isArray(router.query.selection)
    ? router.query.selection
    : [];
  const legacyGroup =
    typeof router.query.releaseVersion === "string"
      ? router.query.releaseVersion
      : "";
  const overview = !legacy && selection.length === 0;
  const productId = legacy
    ? legacyGroup.startsWith("acm-")
      ? "acm"
      : legacyGroup.startsWith("mce-")
        ? "mce"
        : "openshift"
    : selection[0];
  const catalog = useDashboardResource<Product[]>(
    router.isReady ? "products/" : null,
  );
  const product = catalog.data?.find((item) => item.id === productId);
  const ga = useDashboardResource<{ payload: string }>(
    product?.id === "openshift" ? "ga-version" : null,
  );
  const groups = useDashboardResource<string[]>(
    router.isReady && product ? `products/${product.id}/groups/` : null,
  );
  const group = legacy ? legacyGroup : selection[1] || groups.data?.[0];
  const listing = useDashboardResource<Release[]>(
    product && group
      ? `products/${product.id}/releases/?group=${encodeURIComponent(group)}`
      : null,
  );
  const page = Number(router.query.page || 1);
  const selectedVersion = legacy
    ? listing.data?.[Math.max(0, Number.isFinite(page) ? page - 1 : 0)]?.version
    : selection[2] || listing.data?.[0]?.version;
  const release = listing.data?.find(
    (item) => item.version === selectedVersion,
  );
  const navigate = (id: string, targetGroup?: string, version?: string) =>
    router.push(releasePath(id, targetGroup, version));
  const invalidProduct =
    router.isReady && !overview && catalog.data && !product;
  return (
    <>
      <Head>
        <title>
          {overview ? "All products" : product?.name || "Release status"} · ART
          Dashboard
        </title>
      </Head>
      <DashboardLayout
        products={catalog.data || []}
        productId={product?.id}
        gaVersion={ga.data?.payload}
        onProductChange={(id) => navigate(id)}
        overview={overview}
        releaseHref={
          product
            ? releasePath(product.id, group, selectedVersion)
            : "/dashboard"
        }
        versionList={overview ? [] : listing.data?.map((item) => item.version)}
        currentVersion={selectedVersion}
        onVersionSelect={(version) =>
          product && navigate(product.id, group, version)
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div className="text-xs text-muted-foreground">
            {overview
              ? "Workspace / All products"
              : `${product?.name || "Product"} / ${group || "Groups"} / Release status`}
          </div>
          {!overview && product && groups.data && groups.data.length > 0 && (
            <label className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              Group
              <select
                aria-label="Product group"
                value={group || ""}
                onChange={(event) => navigate(product.id, event.target.value)}
                className="min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                {group && !groups.data.includes(group) && (
                  <option value={group}>{group}</option>
                )}
                {groups.data.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-4 py-7 sm:px-6 lg:px-8">
          {catalog.loading && <Loading />}
          {catalog.error && (
            <ErrorState message={catalog.error} retry={catalog.retry} />
          )}
          {invalidProduct && (
            <ErrorState
              message="This product is not supported."
              retry={() => router.push("/dashboard/products")}
            />
          )}
          {overview && catalog.data && <Overview />}
          {!overview && product && (
            <>
              {(groups.loading || listing.loading) && <Loading />}
              {groups.error && (
                <ErrorState message={groups.error} retry={groups.retry} />
              )}
              {listing.error && (
                <ErrorState message={listing.error} retry={listing.retry} />
              )}
              {groups.data?.length === 0 && (
                <div className="py-16 text-center text-muted-foreground">
                  No groups are configured for {product.name}.
                </div>
              )}
              {listing.data && !listing.data.length && (
                <div className="py-16 text-center">
                  <h1 className="text-lg font-medium">No releases recorded</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {group} has no release entries yet. Choose another group to
                    view its releases.
                  </p>
                </div>
              )}
              {listing.data && listing.data.length > 0 && !release && (
                <p role="alert" className="py-12 text-destructive">
                  This release is not recorded in {group}. Choose a release from
                  the sidebar.
                </p>
              )}
              {release && group && (
                <ReleaseContent
                  key={`${product.id}/${group}/${release.version}`}
                  product={product}
                  group={group}
                  release={release}
                  gaVersion={ga.data?.payload}
                />
              )}
            </>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}

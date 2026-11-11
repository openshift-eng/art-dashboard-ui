import React from "react";
import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import ProductDashboard from "../components/dashboard/ProductDashboard";
import { ThemeProvider } from "../components/theme/ThemeProvider";
import { makeApiCall } from "../components/api_calls/api_calls";
import { environmentSummary, externalUrl, releasePath } from "../lib/releases";

jest.mock("../components/api_calls/api_calls", () => ({
  makeApiCall: jest.fn(),
}));
const router = {
  isReady: true,
  query: {} as Record<string, any>,
  push: jest.fn(),
  replace: jest.fn(),
};
jest.mock("next/router", () => ({ useRouter: () => router }));
const api = makeApiCall as jest.Mock;
const products = [
  {
    id: "openshift",
    name: "OpenShift",
    description: "OpenShift Container Platform",
    release_streams: true,
  },
  {
    id: "acm",
    name: "ACM",
    description: "Advanced Cluster Management",
    release_streams: false,
  },
  {
    id: "mce",
    name: "MCE",
    description: "Multicluster Engine",
    release_streams: false,
  },
];
const release = (version = "2.17.4") => ({
  version,
  shipment_url: "https://gitlab.cee.redhat.com/test/-/merge_requests/1",
  advisories: {},
});
const shipments = ["acm-2-17", "acm-2-17-fbc-4-20", "acm-2-17-fbc-4-21"].map(
  (application, index) => ({
    id: application,
    application,
    kind: index ? "fbc" : "image",
    advisory_required: !index,
    stage: { status: "Succeeded", pipeline_url: "https://example.com/stage" },
    prod: { status: index === 2 ? "Succeeded" : "Not started" },
  }),
);
const detail = (version = "2.17.4") => ({
  ...release(version),
  status: "Partially shipped",
  shipments,
  approvals: { Docs: { approved: true, approved_by: "" } },
});

function route(id = "acm", group = "acm-2.17", version = "2.17.4") {
  router.query = { selection: [id, group, version] };
}

function respond(url: string) {
  if (url.includes("/ga/")) {
    const id = url.includes("openshift")
      ? "openshift"
      : url.includes("mce")
        ? "mce"
        : "acm";
    const version = id === "openshift" ? "4.21" : "5.0";
    return { version, group: `${id}-${version}`, source: "test" };
  }
  if (url.endsWith("products/")) return products;
  if (url.includes("/groups/"))
    return url.includes("mce")
      ? ["mce-5.1", "mce-5.0", "mce-2.17"]
      : url.includes("openshift")
        ? ["openshift-4.21"]
        : ["acm-5.1", "acm-5.0", "acm-2.17"];
  if (url.includes("/releases/"))
    return url.includes("-5.1")
      ? []
      : url.includes("openshift")
        ? [release("4.21.42"), release("4.21.41")]
        : url.includes("-5.0")
          ? [release("5.0.0")]
          : [release()];
  if (url.includes("/release/"))
    return detail(url.includes("4.21.41") ? "4.21.41" : "2.17.4");
  throw new Error(`Unexpected test endpoint: ${url}`);
}

function dashboard(legacy = false) {
  return (
    <ThemeProvider>
      <ProductDashboard legacy={legacy} />
    </ThemeProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  router.push.mockClear();
  router.replace.mockClear();
  api.mockReset();
  api.mockImplementation(async (url: string) => respond(url));
  route();
});

test("shows separate FBC targets and per-shipment environment states", async () => {
  render(dashboard());
  const table = await screen.findByRole("table", { name: "Shipment status" });
  expect(within(table).getAllByRole("row")).toHaveLength(4);
  expect(screen.getByText("acm-2-17-fbc-4-20")).toBeInTheDocument();
  expect(screen.getByText("acm-2-17-fbc-4-21")).toBeInTheDocument();
  expect(screen.queryByText("Release streams")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "approvals" }));
  expect(
    screen.getByText("Reviewer not reported by GitLab"),
  ).toBeInTheDocument();
  expect(screen.getByText("Approved")).toBeInTheDocument();
});

test("switching product and group uses stable URLs", async () => {
  render(dashboard());
  await screen.findByRole("table", { name: "Shipment status" });
  fireEvent.change(screen.getByLabelText("Product"), {
    target: { value: "mce" },
  });
  expect(router.push).toHaveBeenCalledWith("/dashboard/products/mce");
  fireEvent.change(screen.getByRole("combobox", { name: "Product group" }), {
    target: { value: "acm-5.0" },
  });
  expect(router.push).toHaveBeenCalledWith("/dashboard/products/acm/acm-5.0");
});

test.each(["openshift", "acm", "mce"])(
  "%s opens its GA group and shows a linked GA footer",
  async (id) => {
    router.query = { selection: [id] };
    render(dashboard());
    const version = id === "openshift" ? "4.21" : "5.0";
    const path = `/dashboard/products/${id}/${id}-${version}`;
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith(path));
    expect(screen.getByLabelText("Product group")).toHaveValue(
      `${id}-${version}`,
    );
    expect(
      await screen.findByRole("link", { name: `v${version}` }),
    ).toHaveAttribute("href", path);
    expect(screen.getByText("Latest GA Version")).toBeInTheDocument();
    expect(await screen.findByText("GA")).toBeInTheDocument();
    expect(
      api.mock.calls.some(([url]) => url.includes(`group=${id}-5.1`)),
    ).toBe(false);
    expect(
      screen.getByRole("link", { name: /Build history/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Build failures/i }),
    ).toBeInTheDocument();
  },
);

test("an explicit older release stays selected while the footer links to latest GA", async () => {
  render(dashboard());
  await screen.findByRole("heading", { name: "ACM 2.17.4" });
  expect(await screen.findByRole("link", { name: "v5.0" })).toHaveAttribute(
    "href",
    "/dashboard/products/acm/acm-5.0",
  );
  expect(router.replace).not.toHaveBeenCalled();
  expect(screen.queryByText("GA")).not.toBeInTheDocument();
});

test("a product without GA lets users select a group without guessing a default", async () => {
  router.query = { selection: ["acm"] };
  api.mockImplementation(async (url: string) =>
    url.includes("/ga/")
      ? { version: null, group: null, source: "build-data-releases" }
      : respond(url),
  );
  render(dashboard());
  await screen.findByText(/No GA version was found for ACM/);
  expect(screen.getByText("Not determined")).toBeInTheDocument();
  expect(router.replace).not.toHaveBeenCalled();
  expect(api.mock.calls.some(([url]) => url.includes("/releases/"))).toBe(
    false,
  );
  fireEvent.change(screen.getByLabelText("Product group"), {
    target: { value: "acm-5.1" },
  });
  expect(router.push).toHaveBeenCalledWith("/dashboard/products/acm/acm-5.1");
});

test("GA errors can be retried and do not choose the newest group", async () => {
  router.query = { selection: ["mce"] };
  api.mockImplementation(async (url: string) =>
    url.includes("/ga/") ? { error: "Build data unavailable" } : respond(url),
  );
  render(dashboard());
  await screen.findByText(/Could not determine the latest GA version/);
  expect(router.replace).not.toHaveBeenCalled();
  expect(api.mock.calls.some(([url]) => url.includes("/releases/"))).toBe(
    false,
  );
  api.mockImplementation(async (url: string) => respond(url));
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() =>
    expect(router.replace).toHaveBeenCalledWith(
      "/dashboard/products/mce/mce-5.0",
    ),
  );
});

test("explicit release links remain usable when GA lookup fails", async () => {
  api.mockImplementation(async (url: string) =>
    url.includes("/ga/") ? { error: "Build data unavailable" } : respond(url),
  );
  render(dashboard());
  await screen.findByRole("heading", { name: "ACM 2.17.4" });
  expect(router.replace).not.toHaveBeenCalled();
});

test("dashboard entry resolves OpenShift GA at runtime", async () => {
  const config = require("../next.config");
  expect(await config.redirects()).toContainEqual({
    source: "/dashboard",
    destination: "/dashboard/products/openshift",
    permanent: false,
  });
});

test("late responses from a previous product cannot replace the selected release", async () => {
  let resolveOld: (value: any) => void;
  api.mockImplementation((url: string) =>
    url.includes("acm/release/")
      ? new Promise((resolve) => {
          resolveOld = resolve;
        })
      : Promise.resolve(respond(url)),
  );
  const view = render(dashboard());
  await waitFor(() => expect(resolveOld).toBeDefined());
  route("mce", "mce-2.17");
  view.rerender(dashboard());
  await screen.findByRole("heading", { name: "MCE 2.17.4" });
  await act(async () => {
    resolveOld({ ...detail(), status: "WRONG PRODUCT" });
  });
  expect(screen.queryByText("WRONG PRODUCT")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "ACM 2.17.4" }),
  ).not.toBeInTheDocument();
});

test("empty groups show an empty state rather than a loading spinner", async () => {
  route("mce", "mce-5.1", "");
  render(dashboard());
  await screen.findByRole("heading", { name: "No releases recorded" });
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

test("GitLab failures show a retry action without fallback release statuses", async () => {
  api.mockImplementation(async (url: string) =>
    url.includes("/release/") ? { error: "GitLab unavailable" } : respond(url),
  );
  render(dashboard());
  await screen.findByText("GitLab unavailable");
  expect(screen.queryByText("Pending")).not.toBeInTheDocument();
  expect(screen.queryByText("Not Approved")).not.toBeInTheDocument();
  api.mockImplementation(async (url: string) => respond(url));
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await screen.findByRole("table", { name: "Shipment status" });
});

test("legacy OpenShift URLs preserve page selection and release stream links", async () => {
  router.query = { releaseVersion: "openshift-4.21", page: "2" };
  render(dashboard(true));
  await screen.findByRole("heading", { name: "OpenShift 4.21.41" });
  await screen.findByText("GA");
  expect(screen.getByText("Latest GA Version")).toBeInTheDocument();
  expect(screen.getByText("Release streams")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "amd64" })).toHaveAttribute(
    "href",
    expect.stringContaining("4.21.41"),
  );
  expect(api).toHaveBeenCalledWith(
    expect.stringContaining("assembly=4.21.41"),
    "GET",
    {},
    expect.anything(),
  );
  expect(router.replace).not.toHaveBeenCalled();
});

test("approved dark theme retains a persisted light-mode preference", async () => {
  localStorage.setItem("art-dashboard-theme", "light");
  render(dashboard());
  await screen.findByRole("heading", { name: "ACM 2.17.4" });
  expect(document.documentElement).not.toHaveClass("dark");
  fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));
  expect(document.documentElement).toHaveClass("dark");
  expect(localStorage.getItem("art-dashboard-theme")).toBe("dark");
});

test("ErrataTool advisories remain visible when the shipment lookup fails", async () => {
  router.query = { releaseVersion: "openshift-4.21" };
  api.mockImplementation(async (url: string) => {
    if (url.includes("/releases/"))
      return [{ ...release("4.21.42"), advisories: { rpm: 176621 } }];
    if (url.includes("/release/"))
      return { error: "Shipment service unavailable" };
    if (url.includes("errata/advisory/batch/"))
      return {
        data: {
          "176621": {
            status: "success",
            data: {
              advisory_details: [
                {
                  id: 176621,
                  status: "SHIPPED_LIVE",
                  advisory_type: "RHBA",
                  doc_complete: "Approved",
                },
              ],
              bug_summary: [],
            },
          },
        },
      };
    return respond(url);
  });
  render(dashboard(true));
  await screen.findByText("Shipment service unavailable");
  expect(await screen.findByRole("link", { name: "176621" })).toHaveAttribute(
    "href",
    "https://errata.devel.redhat.com/advisory/176621",
  );
  expect(screen.getByText("SHIPPED_LIVE")).toBeInTheDocument();
});

test("overview keeps healthy products visible when another source fails", async () => {
  router.query = {};
  api.mockImplementation(async (url: string) =>
    url.endsWith("overview/")
      ? [
          { product: products[1], group: "acm-2.17", release: detail() },
          { product: products[2], error: "Upstream failure" },
        ]
      : respond(url),
  );
  render(dashboard());
  const table = await screen.findByRole("table", {
    name: "Product release overview",
  });
  expect(within(table).getByRole("link", { name: "ACM" })).toHaveAttribute(
    "href",
    "/dashboard/products/acm/acm-2.17/2.17.4",
  );
  expect(
    within(table).getByText(/Release data unavailable/),
  ).toBeInTheDocument();
});

test("URL and aggregate helpers preserve unknown and partial states", () => {
  expect(environmentSummary(shipments, "prod")).toBe("Partial");
  expect(
    environmentSummary(
      [{ id: "broken", kind: "image", error: "failed" }],
      "stage",
    ),
  ).toBe("Unknown");
  expect(externalUrl("data:text/html,preview")).toBeUndefined();
  expect(releasePath("acm", "acm-2.17", "2.17.4")).toBe(
    "/dashboard/products/acm/acm-2.17/2.17.4",
  );
});

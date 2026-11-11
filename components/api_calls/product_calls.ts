import { useEffect, useState } from "react";
import { makeApiCall } from "./api_calls";

export async function getDashboardData<T>(path: string): Promise<T> {
  const prefix = process.env.NEXT_PUBLIC_API_ENDPOINT || "api/v1";
  const data = await makeApiCall(
    `${prefix}/${path}`,
    "GET",
    {},
    { Accept: "application/json" },
  );
  if (!data || data.error || data.detail || data.status === "error") {
    throw new Error(
      data?.error ||
        data?.message ||
        data?.detail ||
        "Release data is unavailable. Please retry.",
    );
  }
  return data;
}

export function useDashboardResource<T>(path: string | null) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    path: string;
    data?: T;
    error?: string;
    loading: boolean;
  }>({ path: "", loading: true });
  useEffect(() => {
    if (!path) return;
    let active = true;
    setState({ path, loading: true });
    getDashboardData<T>(path)
      .then((data) => {
        if (active) setState({ path, data, loading: false });
      })
      .catch((error) => {
        if (active) setState({ path, error: error.message, loading: false });
      });
    return () => {
      active = false;
    };
  }, [path, attempt]);
  const current =
    path && path === state.path
      ? state
      : { loading: !!path, data: undefined, error: undefined };
  return { ...current, retry: () => setAttempt((previous) => previous + 1) };
}

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

export const Service = {
  WEBSCRAPER: "WEBSCRAPER",
} as const;
export type Service = (typeof Service)[keyof typeof Service];

export const Method = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
} as const;
export type Method = (typeof Method)[keyof typeof Method];

const SERVICE_BASE_URL: Record<Service, string> = {
  [Service.WEBSCRAPER]: "https://api.webscraper.ropegeo.com",
};

const PATH_PARAM_PATTERN = /:([a-zA-Z0-9_]+)/g;

function buildUrl(
  baseUrl: string,
  path: string,
  pathParams?: Record<string, string>,
  queryParams?: Record<string, string | number | boolean | undefined>
): string {
  let resolvedPath = path;
  if (pathParams) {
    for (const [key, value] of Object.entries(pathParams)) {
      resolvedPath = resolvedPath.replace(`:${key}`, String(value));
    }
  }
  const unresolved = [...resolvedPath.matchAll(PATH_PARAM_PATTERN)].map(
    (m) => m[1]
  );
  if (unresolved.length > 0) {
    throw new Error(
      `Unresolved path params in "${path}": ${unresolved.join(", ")}`
    );
  }
  const url = new URL(resolvedPath, baseUrl);
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export type RopeGeoHttpRequestProps<T = unknown> = {
  service: Service;
  method: Method;
  path: string;
  pathParams?: Record<string, string>;
  queryParams?: Record<string, string | number | boolean | undefined>;
  body?: object;
  children: (args: {
    loading: boolean;
    data: T | null;
    errors: Error | null;
  }) => ReactNode;
};

export function RopeGeoHttpRequest<T = unknown>({
  service,
  method,
  path,
  pathParams,
  queryParams,
  body,
  children,
}: RopeGeoHttpRequestProps<T>) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<T | null>(null);
  const [errors, setErrors] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const baseUrl = SERVICE_BASE_URL[service];
    const url = buildUrl(baseUrl, path, pathParams, queryParams);

    setLoading(true);
    setErrors(null);

    const init: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };
    if (body != null && (method === Method.POST || method === Method.PUT)) {
      init.body = JSON.stringify(body);
    }

    fetch(url, init)
      .then(async (res) => {
        if (cancelled) return;
        const text = await res.text();
        if (!res.ok) {
          setErrors(new Error(`HTTP ${res.status}: ${text || res.statusText}`));
          setData(null);
          return;
        }
        if (text.length === 0) {
          setData(null);
          return;
        }
        try {
          setData(JSON.parse(text) as T);
        } catch {
          setErrors(new Error("Invalid JSON response"));
          setData(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setErrors(err instanceof Error ? err : new Error(String(err)));
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [service, method, path, pathParams, queryParams, body]);

  return <>{children({ loading, data, errors })}</>;
}

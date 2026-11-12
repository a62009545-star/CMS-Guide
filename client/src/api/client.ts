export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: { path: string; message: string }[],
  ) {
    super(message);
  }
}

type Opts = Omit<RequestInit, 'body'> & { body?: unknown; query?: Record<string, string | number | undefined | null> };

/** Thin fetch wrapper: JSON in/out, cookie auth, CSRF header, typed errors. */
export async function api<T = unknown>(path: string, opts: Opts = {}): Promise<T> {
  const { body, query, headers, ...rest } = opts;
  let url = `/api${path}`;
  if (query) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    const s = qs.toString();
    if (s) url += `?${s}`;
  }
  const res = await fetch(url, {
    credentials: 'include',
    ...rest,
    headers: {
      'X-Requested-With': 'cms-guide',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event('cms:unauthorized'));
    throw new ApiError(res.status, data.error ?? `Request failed (${res.status})`, data.details);
  }
  return data as T;
}

export const get = <T>(path: string, query?: Opts['query']) => api<T>(path, { query });
export const post = <T>(path: string, body?: unknown) => api<T>(path, { method: 'POST', body: body ?? {} });
export const put = <T>(path: string, body: unknown) => api<T>(path, { method: 'PUT', body });
export const patch = <T>(path: string, body: unknown) => api<T>(path, { method: 'PATCH', body });
export const del = <T>(path: string) => api<T>(path, { method: 'DELETE' });

export function errorMessage(err: unknown) {
  if (err instanceof ApiError) {
    if (err.details?.length) return `${err.message}: ${err.details.map((d) => `${d.path || 'field'} — ${d.message}`).join('; ')}`;
    return err.message;
  }
  return err instanceof Error ? err.message : 'Something went wrong';
}

/**
 * Global test setup for API testing.
 * We test by making HTTP requests to the running dev server.
 * This file sets up the base URL for all tests.
 */

export const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

/**
 * Helper to make API requests with proper error handling.
 */
export async function api(path: string, options?: RequestInit) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  return res;
}

/**
 * Helper to make API requests and parse JSON response.
 */
export async function apiJSON<T = unknown>(path: string, options?: RequestInit): Promise<{ status: number; data: T }> {
  const res = await api(path, options);
  const data = await res.json() as T;
  return { status: res.status, data };
}

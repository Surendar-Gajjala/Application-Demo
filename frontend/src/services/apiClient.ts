import axios from 'axios';

import type { ApiProblem } from '../types/page';

/** HTTP client for the local backend only. The frontend never calls the hosted server. */
export const apiClient = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/json' },
  timeout: 60_000,
});

/** User-facing message for a failed request, preferring the backend's problem detail. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiProblem>(error)) {
    const detail = error.response?.data?.detail;
    if (detail) return detail;
    if (!error.response) return 'Cannot reach the application server.';
    return `Request failed (${error.response.status}).`;
  }
  return 'Something went wrong.';
}

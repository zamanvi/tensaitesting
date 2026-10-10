import { PUBLIC_API } from '@/lib/publicApi';

/**
 * Server-side fetch of one public API endpoint, cached by Next for 60s.
 *
 * Used to hand a page's client component an "initial data" snapshot so the first paint is
 * not an empty skeleton. It is deliberately fail-safe: a timeout, a non-200 or invalid
 * JSON all resolve to `null`, and callers treat `null` as "no snapshot" (the page then
 * behaves exactly as it did before: skeleton, then the browser fetch). It never throws.
 * The browser still refetches after mount, so the data a visitor finally sees is as fresh
 * as before — the snapshot only removes the wait.
 */
export async function snapshot<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${PUBLIC_API}${path}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

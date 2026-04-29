/**
 * Server Actions that call `redirect()` throw a `NEXT_REDIRECT` exception
 * which Next.js catches at a higher boundary. When you wrap such an action
 * in a client-side try/catch, the redirect bubbles into your catch — but it
 * is NOT a real error, just Next.js's signal to navigate.
 *
 * Use this helper to distinguish genuine errors from redirect signals:
 *
 *   try { await someActionThatRedirects(); }
 *   catch (e) {
 *     if (isRedirectError(e)) throw e;   // let Next.js handle navigation
 *     toast.error("real failure");
 *   }
 */
export function isRedirectError(err: unknown): boolean {
  if (err === null || typeof err !== "object") return false;
  const digest = (err as { digest?: unknown }).digest;
  if (typeof digest !== "string") return false;
  return (
    digest.startsWith("NEXT_REDIRECT") ||
    digest === "NEXT_NOT_FOUND" ||
    digest === "NEXT_HTTP_ERROR_FALLBACK;404"
  );
}

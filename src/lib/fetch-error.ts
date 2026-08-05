/**
 * Turn a failed `fetch` into a sentence a waiter can act on.
 *
 * The distinction that matters on a restaurant LAN: a rejected `fetch` (our
 * callers catch to `null`) means the device never reached the server — wrong
 * Wi-Fi, server restarting, cable out — and the fix is in the room. A response
 * that arrived and said no is a different problem and usually carries its own
 * message from `respond.ts`. Collapsing both into "that didn't go through" told
 * staff nothing they could do.
 */
export const NETWORK_MESSAGE =
  "Can't reach the till — check this device is on the restaurant's network, then try again.";

export const SERVER_MESSAGE = "The server hit an error. Try again in a moment.";

const GENERIC = "That didn't go through — try again.";

/** For callers that don't need the response body themselves. */
export async function failureMessage(res: Response | null): Promise<string> {
  if (!res) return NETWORK_MESSAGE;
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  if (data?.error) return data.error;
  return res.status >= 500 ? SERVER_MESSAGE : GENERIC;
}

/** For callers that have already read the body (and so can't read it twice). */
export function messageFor(res: Response | null, parsed: { error?: string } | null): string {
  if (!res) return NETWORK_MESSAGE;
  if (parsed?.error) return parsed.error;
  return res.status >= 500 ? SERVER_MESSAGE : GENERIC;
}

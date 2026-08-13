/**
 * wallet-pass-proxy.js — Cloudflare Worker. NOT deployed by Base44.
 *
 * Why this exists
 * ---------------
 * Apple Wallet auto-update requires a web service at `webServiceURL` that
 * answers sub-paths like:
 *
 *   POST   /v1/devices/{deviceId}/registrations/{passTypeId}/{serial}
 *   DELETE /v1/devices/{deviceId}/registrations/{passTypeId}/{serial}
 *   GET    /v1/devices/{deviceId}/registrations/{passTypeId}
 *   GET    /v1/passes/{passTypeId}/{serial}
 *   POST   /v1/log
 *
 * Base44 resolves a backend function from the WHOLE request path, so
 * `.../functions/wallet-pass/v1/log` is read as a function *named*
 * "wallet-pass/v1/log" and 404s. Verified against the live app.
 *
 * This worker sits on a domain you control and forwards the PassKit path to
 * the Base44 function as a `ws` query param, which entry.ts reads.
 *
 * Deploy
 * ------
 *   npm create cloudflare@latest wallet-pass-proxy
 *   # replace src/index.js with this file, set BASE44_FUNCTION_URL below
 *   npx wrangler deploy
 *   # route a custom domain at it, e.g. pass.yourclub.com.au
 *
 * Then set the Base44 secret so issued passes point at the proxy:
 *   WALLET_PASS_BASE_URL=https://pass.yourclub.com.au
 *
 * IMPORTANT: webServiceURL is baked into every pass at issue time and cannot
 * be changed without reissuing. Point it at your own domain BEFORE issuing
 * passes to real members, even if the proxy goes up later.
 */

const BASE44_FUNCTION_URL =
  "https://charlestown-rl-community-app-1e1650bd.base44.app/api/apps/6966ba172da6c09d1e1650bd/functions/wallet-pass";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Pass the PassKit path through as ?ws=/v1/...
    const target = new URL(BASE44_FUNCTION_URL);
    if (url.pathname && url.pathname !== "/") {
      target.searchParams.set("ws", url.pathname);
    }
    // Preserve PassKit's own query params (e.g. passesUpdatedSince).
    for (const [k, v] of url.searchParams) {
      if (k !== "ws") target.searchParams.set(k, v);
    }

    const headers = new Headers(request.headers);
    headers.delete("host");

    const upstream = await fetch(target.toString(), {
      method: request.method,
      headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.arrayBuffer(),
    });

    // Stream the .pkpass straight back, preserving content type.
    return new Response(upstream.body, {
      status: upstream.status,
      headers: upstream.headers,
    });
  },
};

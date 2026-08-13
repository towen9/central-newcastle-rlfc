/**
 * apns.ts — push a "your pass changed" ping to Apple Wallet.
 *
 * Token-based auth (.p8), not certificate mTLS, so it's a plain fetch with no
 * client-cert plumbing. The push body is deliberately empty: it just tells the
 * device to come back and re-fetch the pass.
 */

const APNS_HOST = "https://api.push.apple.com";

let cachedToken: { jwt: string; issuedAt: number } | null = null;

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function pemToPkcs8(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  return Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
}

/** APNs provider tokens last ~1h; Apple rejects refreshes under 20 min. */
async function providerToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now - cachedToken.issuedAt < 2400) return cachedToken.jwt;

  const keyId = Deno.env.get("APNS_KEY_ID");
  const teamId = Deno.env.get("APPLE_TEAM_ID");
  let p8 = Deno.env.get("APNS_AUTH_KEY_P8");
  if (!keyId || !teamId || !p8) {
    throw new Error("Missing APNS_KEY_ID / APPLE_TEAM_ID / APNS_AUTH_KEY_P8");
  }
  if (!p8.includes("-----BEGIN")) {
    p8 = new TextDecoder().decode(
      Uint8Array.from(atob(p8.replace(/\s+/g, "")), (c) => c.charCodeAt(0)),
    );
  }
  p8 = p8.replace(/\\n/g, "\n");

  const enc = new TextEncoder();
  const signingInput =
    b64url(enc.encode(JSON.stringify({ alg: "ES256", kid: keyId }))) +
    "." +
    b64url(enc.encode(JSON.stringify({ iss: teamId, iat: now })));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(p8),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      enc.encode(signingInput),
    ),
  );

  const jwt = `${signingInput}.${b64url(sig)}`;
  cachedToken = { jwt, issuedAt: now };
  return jwt;
}

export interface PushResult {
  pushToken: string;
  ok: boolean;
  status: number;
  reason?: string;
  /** true when Apple says this device is gone — drop the registration */
  unregister?: boolean;
}

export async function pushPassUpdate(
  pushTokens: string[],
  passTypeIdentifier: string,
): Promise<PushResult[]> {
  if (!pushTokens.length) return [];
  const jwt = await providerToken();

  return await Promise.all(
    pushTokens.map(async (pushToken): Promise<PushResult> => {
      try {
        const res = await fetch(`${APNS_HOST}/3/device/${pushToken}`, {
          method: "POST",
          headers: {
            authorization: `bearer ${jwt}`,
            "apns-topic": passTypeIdentifier,
            "apns-push-type": "background",
            "apns-priority": "5",
          },
          // Empty payload is correct for pass updates.
          body: "{}",
        });

        if (res.ok) return { pushToken, ok: true, status: res.status };

        let reason: string | undefined;
        try {
          reason = (await res.json())?.reason;
        } catch {
          reason = await res.text();
        }
        return {
          pushToken,
          ok: false,
          status: res.status,
          reason,
          unregister: res.status === 410 || reason === "BadDeviceToken",
        };
      } catch (err) {
        return { pushToken, ok: false, status: 0, reason: String(err) };
      }
    }),
  );
}

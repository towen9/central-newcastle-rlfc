/**
 * google.ts — Google Wallet loyalty passes.
 *
 * Simpler than Apple: no zip, no PKCS#7. Sign a JWT with a Google Cloud
 * service account key and hand the user a save link. Updates are a PATCH
 * against the Wallet Objects API.
 */

import type { ClubRecord, RenderedPass } from "./pass-data.ts";

const WALLET_API = "https://walletobjects.googleapis.com/walletobjects/v1";
const SAVE_URL = "https://pay.google.com/gp/v/save/";

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

function serviceAccount(): ServiceAccount {
  const raw = Deno.env.get("GOOGLE_WALLET_SERVICE_ACCOUNT_JSON");
  if (!raw) throw new Error("Missing secret: GOOGLE_WALLET_SERVICE_ACCOUNT_JSON");
  const json = raw.trim().startsWith("{")
    ? JSON.parse(raw)
    : JSON.parse(
        new TextDecoder().decode(
          Uint8Array.from(atob(raw.replace(/\s+/g, "")), (c) => c.charCodeAt(0)),
        ),
      );
  return { client_email: json.client_email, private_key: json.private_key };
}

function b64url(bytes: Uint8Array): string {
  let bin = "";
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToPkcs8(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  return Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
}

async function signRs256(payload: unknown, sa: ServiceAccount): Promise<string> {
  const enc = new TextEncoder();
  const signingInput =
    b64url(enc.encode(JSON.stringify({ alg: "RS256", typ: "JWT" }))) +
    "." +
    b64url(enc.encode(JSON.stringify(payload)));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(sa.private_key.replace(/\\n/g, "\n")),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(signingInput)),
  );
  return `${signingInput}.${b64url(sig)}`;
}

/** OAuth access token for the Wallet Objects API, via JWT bearer grant. */
async function accessToken(): Promise<string> {
  const sa = serviceAccount();
  const now = Math.floor(Date.now() / 1000);
  const assertion = await signRs256(
    {
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/wallet_object.issuer",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    },
    sa,
  );

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Google token error: ${JSON.stringify(json)}`);
  return json.access_token;
}

export function issuerId(): string {
  const id = Deno.env.get("GOOGLE_WALLET_ISSUER_ID");
  if (!id) throw new Error("Missing secret: GOOGLE_WALLET_ISSUER_ID");
  return id;
}

/** One class per club, so a multi-tenant rollout doesn't collide. */
export function classId(clubSlug = "default"): string {
  const safe = clubSlug.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${issuerId()}.membership_${safe}`;
}

export function buildLoyaltyObject(
  p: RenderedPass,
  serial: string,
  clubSlug?: string,
) {
  return {
    id: `${issuerId()}.${serial}`,
    classId: classId(clubSlug),
    state: p.status === "VALID" ? "ACTIVE" : "EXPIRED",
    accountId: p.barcodeValue,
    accountName: p.name,
    barcode: {
      type: "QR_CODE",
      // Same payload as Apple — the gate scanner doesn't care which wallet.
      value: p.barcodeValue,
      alternateText: p.altText,
    },
    loyaltyPoints: { label: "Points", balance: { int: p.points } },
    hexBackgroundColor: p.style.hex,
    textModulesData: [
      { id: "tier", header: "Tier", body: p.tier },
      { id: "status", header: "Status", body: p.status },
      { id: "nextgame", header: p.nextGameLabel, body: p.nextGameValue },
      ...p.backFields.map((f) => ({ id: f.key, header: f.label, body: f.value })),
    ],
    locations: p.location
      ? [{ latitude: p.location.latitude, longitude: p.location.longitude }]
      : undefined,
  };
}

/** The "Add to Google Wallet" link. Creates the object on first tap. */
export async function saveUrl(
  p: RenderedPass,
  serial: string,
  clubSlug?: string,
): Promise<string> {
  const sa = serviceAccount();
  const origins = (Deno.env.get("APP_ORIGINS") ?? "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);

  const jwt = await signRs256(
    {
      iss: sa.client_email,
      aud: "google",
      typ: "savetowallet",
      iat: Math.floor(Date.now() / 1000),
      origins,
      payload: { loyaltyObjects: [buildLoyaltyObject(p, serial, clubSlug)] },
    },
    sa,
  );
  return SAVE_URL + jwt;
}

/** Push an update to an already-saved card. Silent, instant, no user action. */
export async function patchObject(
  p: RenderedPass,
  serial: string,
  clubSlug?: string,
): Promise<void> {
  const token = await accessToken();
  const objectId = `${issuerId()}.${serial}`;
  const res = await fetch(
    `${WALLET_API}/loyaltyObject/${encodeURIComponent(objectId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildLoyaltyObject(p, serial, clubSlug)),
    },
  );
  // 404 = not saved to a phone yet. Not an error.
  if (!res.ok && res.status !== 404) {
    throw new Error(`Google patch failed ${res.status}: ${await res.text()}`);
  }
}

/** Create the membership class once. 409 means it already exists. */
export async function ensureClass(
  club: ClubRecord,
  clubSlug?: string,
): Promise<string> {
  const token = await accessToken();
  const body = {
    id: classId(clubSlug),
    issuerName: club.name || "Club",
    programName: "Membership",
    reviewStatus: "UNDER_REVIEW",
    hexBackgroundColor: club.primary_color || "#0B2C5E",
    countryCode: "AU",
    programLogo: club.logo_url
      ? { sourceUri: { uri: club.logo_url } }
      : undefined,
  };

  const res = await fetch(`${WALLET_API}/loyaltyClass`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 409) return "already exists";
  if (!res.ok) throw new Error(`Class create failed ${res.status}: ${await res.text()}`);
  return "created";
}

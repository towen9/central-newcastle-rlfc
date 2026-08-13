/**
 * wallet-pass — the digital membership card (Apple Wallet + Google Wallet).
 *
 * One function, four jobs:
 *   1. issue    — mint a card for a membership, return the two add-to-wallet links
 *   2. download — serve the signed .pkpass binary
 *   3. sync     — re-render and push when tier / points / status / fixture change
 *   4. Apple's PassKit web service — device registration + auto-update
 *
 * The barcode payload is Membership.qr_code_id — the exact value GateScan
 * already sends to processScan — so gate scanning is completely unchanged.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

import {
  renderPass,
  contentHash,
  type ClubRecord,
  type FixtureRecord,
  type MembershipRecord,
} from "./lib/pass-data.ts";
import {
  buildPassJson,
  buildPkPass,
  b64ToBytes,
  readPemSecret,
  type AppleCerts,
  type PassAssets,
} from "./lib/pkpass.ts";
import * as google from "./lib/google.ts";
import { pushPassUpdate } from "./lib/apns.ts";

// ---------------------------------------------------------------- config

const PASS_TYPE_ID = () => Deno.env.get("APPLE_PASS_TYPE_ID") ?? "";
const TEAM_ID = () => Deno.env.get("APPLE_TEAM_ID") ?? "";
const CLUB_SLUG = () => Deno.env.get("CLUB_SLUG") ?? "central-newcastle";
/** Public URL of this function — Apple calls it to refresh passes. */
const WEB_SERVICE_URL = () =>
  (Deno.env.get("WALLET_PASS_BASE_URL") ?? "").replace(/\/+$/, "");

function groundCoords() {
  const lat = Number(Deno.env.get("HOME_GROUND_LAT"));
  const lng = Number(Deno.env.get("HOME_GROUND_LNG"));
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { latitude: lat, longitude: lng };
  }
  // St John Oval, Bula Street, Charlestown — approximate until the pin is set.
  return { latitude: -32.9614, longitude: 151.6928 };
}

function appleCerts(): AppleCerts {
  return {
    signerCertPem: readPemSecret("APPLE_PASS_CERT_PEM"),
    signerKeyPem: readPemSecret("APPLE_PASS_KEY_PEM"),
    signerKeyPassphrase: Deno.env.get("APPLE_PASS_KEY_PASSPHRASE") || undefined,
    wwdrPem: readPemSecret("APPLE_WWDR_PEM"),
    passTypeIdentifier: PASS_TYPE_ID(),
    teamIdentifier: TEAM_ID(),
  };
}

function passAssets(): PassAssets {
  const get = (n: string) => b64ToBytes(Deno.env.get(n) ?? "");
  return {
    "icon.png": get("PASS_ICON_PNG"),
    "icon@2x.png": get("PASS_ICON_2X_PNG"),
    "logo.png": get("PASS_LOGO_PNG"),
    "logo@2x.png": get("PASS_LOGO_2X_PNG"),
    "strip.png": get("PASS_STRIP_PNG"),
    "strip@2x.png": get("PASS_STRIP_2X_PNG"),
  };
}

// ---------------------------------------------------------------- helpers

function randomToken(bytes = 20): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time-ish compare so tokens can't be probed byte by byte. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function getClub(db: any): Promise<ClubRecord> {
  try {
    const bySlug = await db.entities.Club.filter({ slug: CLUB_SLUG() });
    if (bySlug?.length) return bySlug[0];
    const any = await db.entities.Club.filter({ is_active: true });
    if (any?.length) return any[0];
  } catch { /* fall through */ }
  return { name: "Central Newcastle RLFC", venue_name: "St John Oval" };
}

/** Next upcoming fixture — drives the "next game" field and pass relevance. */
async function getNextFixture(db: any): Promise<FixtureRecord | undefined> {
  try {
    const fixtures = await db.entities.Fixture.filter(
      { status: "upcoming", date_time: { $gte: new Date().toISOString() } },
      "date_time",
      1,
    );
    return fixtures?.[0];
  } catch {
    return undefined;
  }
}

async function getMembership(
  db: any,
  membershipId: string,
): Promise<MembershipRecord | null> {
  try {
    return await db.entities.Membership.get(membershipId);
  } catch {
    return null;
  }
}

async function passRecord(db: any, serial: string, platform = "apple") {
  const rows = await db.entities.WalletPass.filter({
    serial_number: serial,
    platform,
  });
  return rows?.[0] ?? null;
}

async function renderFor(db: any, membership: MembershipRecord) {
  const [club, fixture] = await Promise.all([getClub(db), getNextFixture(db)]);
  return renderPass(club, membership, fixture, groundCoords());
}

/** Render + build a signed .pkpass for a stored pass record. */
async function renderApplePass(db: any, rec: any): Promise<Uint8Array> {
  const membership = await getMembership(db, rec.membership_id);
  if (!membership) throw new Error(`Membership ${rec.membership_id} not found`);

  const rendered = await renderFor(db, membership);
  const passJson = buildPassJson(rendered, {
    passTypeIdentifier: PASS_TYPE_ID(),
    teamIdentifier: TEAM_ID(),
    serialNumber: rec.serial_number,
    authenticationToken: rec.auth_token,
    webServiceURL: WEB_SERVICE_URL(),
  });

  return await buildPkPass(passJson, passAssets(), appleCerts());
}

const pkpassResponse = (bytes: Uint8Array, serial: string) =>
  new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `attachment; filename="membership-${serial}.pkpass"`,
      "Cache-Control": "no-store",
      "Last-Modified": new Date().toUTCString(),
    },
  });

// ---------------------------------------------------------------- actions

/** Mint (or reuse) a membership's pass. Idempotent. */
async function actionIssue(db: any, membershipId: string) {
  const membership = await getMembership(db, membershipId);
  if (!membership) {
    return Response.json({ error: "Membership not found" }, { status: 404 });
  }
  if (!membership.qr_code_id) {
    return Response.json(
      { error: "Membership has no qr_code_id — cannot build a scannable card" },
      { status: 409 },
    );
  }

  const rendered = await renderFor(db, membership);
  const hash = await contentHash(rendered);
  const serial = `M-${membership.id}`;
  const now = new Date().toISOString();

  const ensure = async (platform: "apple" | "google") => {
    const existing = (
      await db.entities.WalletPass.filter({
        membership_id: membershipId,
        platform,
      })
    )?.[0];
    if (existing) {
      // Keep the barcode in step if the membership's QR was ever regenerated.
      if (existing.qr_code_id !== membership.qr_code_id) {
        await db.entities.WalletPass.update(existing.id, {
          qr_code_id: membership.qr_code_id,
        });
      }
      return existing;
    }
    return await db.entities.WalletPass.create({
      membership_id: membershipId,
      user_id: membership.user_id,
      qr_code_id: membership.qr_code_id,
      platform,
      serial_number: serial,
      auth_token: platform === "apple" ? randomToken() : undefined,
      google_object_id:
        platform === "google" ? `${google.issuerId()}.${serial}` : undefined,
      device_registrations: [],
      tier_at_issue: rendered.tier,
      content_hash: hash,
      status: "active",
      issued_at: now,
      last_updated_at: now,
    });
  };

  const base = WEB_SERVICE_URL();
  const results: Record<string, unknown> = { success: true, serial };

  // Apple and Google are independent — one being unconfigured must not block
  // the other, or a half-finished setup ships zero cards.
  try {
    const appleRec = await ensure("apple");
    results.apple_url =
      `${base}?action=download&serial=${encodeURIComponent(appleRec.serial_number)}` +
      `&token=${encodeURIComponent(appleRec.auth_token)}`;
  } catch (err) {
    console.error("apple issue failed:", err);
    results.apple_url = null;
    results.apple_error = String(err);
  }

  try {
    const googleRec = await ensure("google");
    results.google_url = await google.saveUrl(
      rendered,
      googleRec.serial_number,
      CLUB_SLUG(),
    );
  } catch (err) {
    console.error("google issue failed:", err);
    results.google_url = null;
    results.google_error = String(err);
  }

  return Response.json(results);
}

/** Re-render and push. Call wherever a membership changes. */
async function actionSync(db: any, membershipId: string, force = false) {
  const membership = await getMembership(db, membershipId);
  if (!membership) {
    return Response.json({ error: "Membership not found" }, { status: 404 });
  }

  const records = await db.entities.WalletPass.filter({
    membership_id: membershipId,
  });
  if (!records?.length) {
    return Response.json({ success: true, skipped: "no passes issued" });
  }

  const rendered = await renderFor(db, membership);
  const hash = await contentHash(rendered);
  const results: unknown[] = [];

  for (const rec of records) {
    if (!force && rec.content_hash === hash) {
      results.push({ platform: rec.platform, skipped: "unchanged" });
      continue;
    }

    if (rec.platform === "google") {
      try {
        await google.patchObject(rendered, rec.serial_number, CLUB_SLUG());
        results.push({ platform: "google", updated: true });
      } catch (err) {
        results.push({ platform: "google", error: String(err) });
      }
    }

    if (rec.platform === "apple") {
      const tokens = (rec.device_registrations ?? [])
        .map((d: any) => d.push_token)
        .filter(Boolean);
      try {
        const pushes = await pushPassUpdate(tokens, PASS_TYPE_ID());
        const dead = new Set(
          pushes.filter((p) => p.unregister).map((p) => p.pushToken),
        );
        if (dead.size) {
          await db.entities.WalletPass.update(rec.id, {
            device_registrations: (rec.device_registrations ?? []).filter(
              (d: any) => !dead.has(d.push_token),
            ),
          });
        }
        results.push({ platform: "apple", devices: tokens.length, pushes });
      } catch (err) {
        results.push({ platform: "apple", error: String(err) });
      }
    }

    await db.entities.WalletPass.update(rec.id, {
      content_hash: hash,
      qr_code_id: membership.qr_code_id,
      tier_at_issue: rendered.tier,
      status: rendered.status === "VALID" ? "active" : "expired",
      last_updated_at: new Date().toISOString(),
      last_pushed_at: new Date().toISOString(),
    });
  }

  return Response.json({ success: true, membership_id: membershipId, results });
}

/** Bulk sync — for a fixture change, where every card's next game moved. */
async function actionSyncAll(db: any) {
  const records = await db.entities.WalletPass.filter({ status: "active" });
  const ids = [...new Set((records ?? []).map((r: any) => r.membership_id))];

  let synced = 0;
  const errors: string[] = [];
  for (const id of ids) {
    try {
      await actionSync(db, id as string);
      synced++;
    } catch (err) {
      errors.push(`${id}: ${err}`);
    }
  }
  return Response.json({ success: true, memberships_synced: synced, errors });
}

// ------------------------------------------- Apple PassKit web service

async function handleAppleWebService(
  db: any,
  req: Request,
  segments: string[],
): Promise<Response | null> {
  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.replace(/^ApplePass\s+/i, "").trim();

  // POST /v1/log — Apple's diagnostics. Always 200.
  if (segments[0] === "v1" && segments[1] === "log") {
    try {
      const body = await req.json();
      console.log("[PassKit log]", JSON.stringify(body?.logs ?? body));
    } catch { /* ignore */ }
    return new Response(null, { status: 200 });
  }

  // /v1/devices/{deviceId}/registrations/{passTypeId}[/{serial}]
  if (segments[0] === "v1" && segments[1] === "devices") {
    const deviceId = segments[2];
    const serial = segments[5];

    if (req.method === "GET" && !serial) {
      const since = new URL(req.url).searchParams.get("passesUpdatedSince");
      const all = await db.entities.WalletPass.filter({ platform: "apple" });
      const mine = (all ?? []).filter((r: any) =>
        (r.device_registrations ?? []).some(
          (d: any) => d.device_library_identifier === deviceId,
        )
      );
      const changed = since
        ? mine.filter((r: any) => (r.last_updated_at ?? "") > since)
        : mine;

      if (!changed.length) return new Response(null, { status: 204 });

      const lastUpdated = changed
        .map((r: any) => r.last_updated_at ?? "")
        .sort()
        .pop();

      return Response.json({
        serialNumbers: changed.map((r: any) => r.serial_number),
        lastUpdated,
      });
    }

    const rec = await passRecord(db, serial);
    if (!rec) return new Response(null, { status: 404 });
    if (!safeEqual(bearer, rec.auth_token ?? "")) {
      return new Response(null, { status: 401 });
    }

    if (req.method === "POST") {
      let pushToken = "";
      try {
        pushToken = (await req.json())?.pushToken ?? "";
      } catch { /* ignore */ }

      const regs = rec.device_registrations ?? [];
      const already = regs.find(
        (d: any) => d.device_library_identifier === deviceId,
      );
      if (already && already.push_token === pushToken) {
        return new Response(null, { status: 200 });
      }

      const next = regs.filter(
        (d: any) => d.device_library_identifier !== deviceId,
      );
      next.push({
        device_library_identifier: deviceId,
        push_token: pushToken,
        registered_at: new Date().toISOString(),
      });
      await db.entities.WalletPass.update(rec.id, {
        device_registrations: next,
        added_to_wallet_at: rec.added_to_wallet_at ?? new Date().toISOString(),
      });
      return new Response(null, { status: 201 });
    }

    if (req.method === "DELETE") {
      await db.entities.WalletPass.update(rec.id, {
        device_registrations: (rec.device_registrations ?? []).filter(
          (d: any) => d.device_library_identifier !== deviceId,
        ),
      });
      return new Response(null, { status: 200 });
    }
  }

  // GET /v1/passes/{passTypeId}/{serial} — hand back the fresh pass
  if (segments[0] === "v1" && segments[1] === "passes") {
    const serial = segments[3];
    const rec = await passRecord(db, serial);
    if (!rec) return new Response(null, { status: 404 });
    if (!safeEqual(bearer, rec.auth_token ?? "")) {
      return new Response(null, { status: 401 });
    }
    return pkpassResponse(await renderApplePass(db, rec), serial);
  }

  return null;
}

// ---------------------------------------------------------------- router

Deno.serve(async (req: Request) => {
  try {
    const client = createClientFromRequest(req);
    const db = client.asServiceRole;
    const url = new URL(req.url);

    // Apple's PassKit web service calls arrive as sub-paths of webServiceURL,
    // e.g. /v1/passes/{passTypeId}/{serial}. Base44 resolves a function from
    // the WHOLE path, so it 404s those before they reach us — verified:
    //   GET .../functions/wallet-pass/v1/log
    //   -> "Backend function 'wallet-pass/v1/log' not found or not deployed"
    //
    // So the PassKit path is delivered via the `ws` query param instead, set
    // by the edge proxy in wallet-pass-proxy.js. We still parse the real path
    // first, so this keeps working if Base44 ever routes sub-paths natively.
    const parts = url.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("wallet-pass");
    let segments = idx >= 0 ? parts.slice(idx + 1) : [];

    if (!segments.length) {
      const ws = url.searchParams.get("ws");
      if (ws) segments = ws.split("/").filter(Boolean);
    }

    if (segments.length) {
      const handled = await handleAppleWebService(db, req, segments);
      if (handled) return handled;
    }

    // Public download link — the "Add to Apple Wallet" tap lands here.
    if (req.method === "GET" && url.searchParams.get("action") === "download") {
      const serial = url.searchParams.get("serial") ?? "";
      const token = url.searchParams.get("token") ?? "";
      const rec = await passRecord(db, serial);
      if (!rec) return Response.json({ error: "Pass not found" }, { status: 404 });
      if (!safeEqual(token, rec.auth_token ?? "")) {
        return Response.json({ error: "Bad token" }, { status: 401 });
      }
      return pkpassResponse(await renderApplePass(db, rec), serial);
    }

    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "issue";

    const me = await client.auth.me().catch(() => null);
    if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const isAdmin = me.role === "admin";

    // Resolve which membership we're acting on, and prove the caller owns it.
    let membershipId: string | null = body.membership_id ?? null;
    if (!membershipId) {
      const mine = await db.entities.Membership.filter({ user_id: me.id });
      membershipId = mine?.[0]?.id ?? null;
    } else if (!isAdmin) {
      const target = await getMembership(db, membershipId);
      if (!target || target.user_id !== me.id) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    switch (action) {
      case "issue":
        if (!membershipId) {
          return Response.json(
            { error: "No membership found for this user" },
            { status: 404 },
          );
        }
        return await actionIssue(db, membershipId);

      case "sync":
        if (!membershipId) {
          return Response.json({ error: "membership_id required" }, { status: 400 });
        }
        return await actionSync(db, membershipId, body.force === true);

      case "sync_all":
        if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });
        return await actionSyncAll(db);

      case "ensure_class": {
        if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });
        const club = await getClub(db);
        return Response.json({
          result: await google.ensureClass(club, CLUB_SLUG()),
        });
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    console.error("[wallet-pass]", err);
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
});

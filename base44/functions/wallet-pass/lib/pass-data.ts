/**
 * pass-data.ts — the single place that decides what a member's card SAYS.
 *
 * Both Apple and Google render from this one shape, so the two wallets can
 * never drift. Multi-tenant: branding comes from the Club record, not
 * hardcoded, so this works for any club on the platform.
 */

export interface ClubRecord {
  name?: string;
  nickname?: string;
  short_name?: string;
  club_short_name?: string;
  team_short?: string;
  venue_name?: string;
  venue_address?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  sport_emoji?: string;
  contact_email?: string;
  membership_partner_name?: string;
  membership_partner_logo_url?: string;
  timezone?: string;
}

/** Mirrors the Membership entity. */
export interface MembershipRecord {
  id: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  tier_id?: string;
  tier_name?: string;
  tier_type?: string;
  status?: string;
  qr_code_id?: string;
  expiry_date?: string;
  start_date?: string;
  points?: number;
  stamps?: number;
  total_checkins?: number;
  games_remaining?: number;
  games_used?: number;
}

/** Mirrors the Fixture entity. */
export interface FixtureRecord {
  id?: string;
  opponent?: string;
  opponent_name?: string;
  fixture_type?: string;
  date_time?: string;
  venue?: string;
  venue_address?: string;
  team_grade?: string;
  round_number?: number;
}

const DEFAULT_TZ = "Australia/Sydney";

/** Hex → "rgb(r,g,b)" for Apple, which won't take hex. */
function hexToRgb(hex?: string, fallback = "rgb(11,44,94)"): string {
  if (!hex) return fallback;
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (full.length !== 6) return fallback;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return fallback;
  return `rgb(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255})`;
}

function normaliseHex(hex?: string, fallback = "#0B2C5E"): string {
  if (!hex) return fallback;
  const h = hex.startsWith("#") ? hex : `#${hex}`;
  return /^#[0-9a-fA-F]{6}$/.test(h) ? h : fallback;
}

/**
 * Tier styling. Derived from the club's own brand colours, with the tier
 * shifting the treatment — so a new tier added in MembershipTier just works
 * instead of falling off a hardcoded list.
 */
export function styleFor(club: ClubRecord, membership: MembershipRecord) {
  const navy = normaliseHex(club.primary_color, "#0B2C5E");
  const gold = normaliseHex(club.secondary_color, "#D4AF37");

  const type = (membership.tier_type ?? "").toLowerCase();
  const name = (membership.tier_name ?? "").toLowerCase();
  const is = (t: string, n: string) => type === t || name.includes(n);

  // Premium and legacy tiers get the dark treatment with a gold label.
  if (is("premium", "premium") || is("legacy", "old butchers")) {
    return { hex: "#081C3E", bg: "rgb(8,28,62)", fg: "rgb(255,255,255)", label: hexToRgb(gold, "rgb(212,175,55)") };
  }
  if (is("supporter", "supporter")) {
    return { hex: "#5A6470", bg: "rgb(90,100,112)", fg: "rgb(255,255,255)", label: "rgb(210,216,224)" };
  }
  if (is("junior", "junior") || name.includes("family")) {
    return { hex: "#0074B5", bg: "rgb(0,116,181)", fg: "rgb(255,255,255)", label: "rgb(198,228,255)" };
  }
  return {
    hex: navy,
    bg: hexToRgb(navy),
    fg: "rgb(255,255,255)",
    label: hexToRgb(gold, "rgb(198,206,216)"),
  };
}

/** Human status line — what gate staff read at a glance. */
export function statusLine(m: MembershipRecord): string {
  if ((m.status ?? "").toLowerCase() !== "active") {
    return (m.status ?? "INACTIVE").toUpperCase();
  }
  if (m.expiry_date && new Date(m.expiry_date) < new Date()) return "EXPIRED";
  return "VALID";
}

function fmtKickoff(iso: string | undefined, tz: string): string {
  if (!iso) return "NEXT GAME";
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
  }).format(new Date(iso));
}

function fmtDate(iso: string | undefined, tz: string): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: tz,
  }).format(new Date(iso));
}

export interface RenderedPass {
  membershipId: string;
  /** Barcode payload — Membership.qr_code_id, exactly what processScan expects. */
  barcodeValue: string;
  name: string;
  tier: string;
  altText: string;
  status: string;
  points: number;
  nextGameLabel: string;
  nextGameValue: string;
  organizationName: string;
  logoText: string;
  description: string;
  backFields: { key: string; label: string; value: string }[];
  style: ReturnType<typeof styleFor>;
  relevantDate?: string;
  location?: { latitude: number; longitude: number; relevantText: string };
  partnerName?: string;
}

/** The one render function. Both wallets are built from the result. */
export function renderPass(
  club: ClubRecord,
  membership: MembershipRecord,
  fixture?: FixtureRecord,
  groundCoords?: { latitude: number; longitude: number },
): RenderedPass {
  const tz = club.timezone || DEFAULT_TZ;
  const clubName = club.name || "Club";
  const tier = membership.tier_name || "Member";
  const status = statusLine(membership);
  const barcodeValue = membership.qr_code_id || "";

  const opponent = fixture?.opponent_name || fixture?.opponent;
  const isHome = (fixture?.fixture_type ?? "home") === "home";
  const nextGameValue = opponent
    ? `${isHome ? "v" : "@"} ${opponent}`
    : "Season break";
  const nextGameLabel = fixture?.date_time
    ? fmtKickoff(fixture.date_time, tz)
    : "NEXT GAME";

  const backFields: { key: string; label: string; value: string }[] = [
    {
      key: "howto",
      label: "How to use your card",
      value:
        "Show this card at the gate and let the volunteer scan the QR. Your check-in, points and entries are logged automatically.",
    },
    { key: "tier", label: "Membership tier", value: tier },
    {
      key: "expiry",
      label: "Valid until",
      value: fmtDate(membership.expiry_date, tz),
    },
    {
      key: "checkins",
      label: "Games attended",
      value: String(membership.total_checkins ?? 0),
    },
  ];

  if (typeof membership.games_remaining === "number") {
    backFields.push({
      key: "remaining",
      label: "Entries remaining",
      value: String(membership.games_remaining),
    });
  }

  if (fixture?.venue) {
    backFields.push({ key: "venue", label: "Next game venue", value: fixture.venue });
  }

  if (club.membership_partner_name) {
    backFields.push({
      key: "partner",
      label: "Official Digital Membership Partner",
      value: club.membership_partner_name,
    });
  }

  backFields.push({
    key: "support",
    label: "Need a hand?",
    value: club.contact_email
      ? `Problem with your card? Email ${club.contact_email} and we'll sort it before kick-off.`
      : "Problem with your card? Reply to your membership email and we'll sort it before kick-off.",
  });

  // Geo-fence: the card surfaces on the lock screen at the ground.
  const coords = groundCoords ?? { latitude: -32.9614, longitude: 151.6928 };
  const groundName = club.venue_name || "the ground";

  return {
    membershipId: membership.id,
    barcodeValue,
    name: membership.user_name || "Member",
    tier,
    altText: (barcodeValue || "").slice(0, 8).toUpperCase(),
    status,
    points: membership.points ?? 0,
    nextGameLabel,
    nextGameValue,
    organizationName: clubName,
    logoText: club.club_short_name || club.team_short || clubName,
    description: `${clubName} Membership`,
    backFields,
    style: styleFor(club, membership),
    relevantDate: fixture?.date_time,
    location: {
      latitude: coords.latitude,
      longitude: coords.longitude,
      relevantText: opponent
        ? `${club.team_short || clubName} v ${opponent} — have your card ready.`
        : `Welcome to ${groundName}. Have your card ready.`,
    },
    partnerName: club.membership_partner_name,
  };
}

/** Stable hash of pass content, so we only push when something changed. */
export async function contentHash(p: RenderedPass): Promise<string> {
  const canonical = JSON.stringify([
    p.name,
    p.tier,
    p.barcodeValue,
    p.status,
    p.points,
    p.nextGameLabel,
    p.nextGameValue,
    p.backFields.map((f) => `${f.key}:${f.value}`),
  ]);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

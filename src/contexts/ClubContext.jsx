import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { resolveFeatures } from '@/config/productTiers';
import { useAuth } from '@/lib/AuthContext';
import staticConfig from '@/config/club.config';
import ActingAsBanner from '@/components/owner/ActingAsBanner';

const ClubContext = createContext(null);
const SS_KEY = 'base44_club_slug';
const FALLBACK_SLUG = 'central-newcastle';
const OWNER_ACTING_KEY = 'owner_acting_club_slug';

let _currentConfig = null;

/**
 * Synchronous accessor for non-component code that can't use the useClub() hook.
 * Returns the currently resolved club config, or the static fallback.
 */
export function getClubConfig() {
  return _currentConfig || staticConfig;
}

/**
 * Merge a Club database record into the same shape as the static clubConfig,
 * overriding identity fields, brand colors, and features from the record
 * while preserving structural config (fonts, season, celebration, terminology,
 * tiers) that doesn't exist on the Club entity.
 */
function buildConfig(club) {
  if (!club) return null;

  // Mapping: primary = structural brand color (navy), secondary = CTA/highlight (gold), accent = cyan.
  // For Central Newcastle these equal the static theme exactly — zero visual change (golden rule).
  const navy = club.primary_color || staticConfig.theme.navy;
  const gold = club.secondary_color || staticConfig.theme.gold;
  const cyan = club.accent_color || staticConfig.theme.cyan;
  const goldHi = gold === staticConfig.theme.gold ? staticConfig.theme.goldHi : gold;

  return {
    ...club,

    identity: {
      club_name: club.name || staticConfig.identity.club_name,
      short_name: club.nickname || staticConfig.identity.short_name,
      sport: club.sport || staticConfig.identity.sport,
      est_year: staticConfig.identity.est_year,
      venue_name: club.venue_name || staticConfig.identity.venue_name,
      logo_url: club.logo_url || staticConfig.identity.logo_url,
      app_url: club.app_url || staticConfig.identity.app_url,
      team_short: club.team_short || staticConfig.identity.team_short,
      club_short_name: club.club_short_name || staticConfig.identity.club_short_name,
      sport_emoji: club.sport_emoji || staticConfig.identity.sport_emoji,
    },

    theme: {
      ...staticConfig.theme,
      navy,
      gold,
      goldHi,
      cyan,
    },

    product_tier: club.product_tier || 'starter',
    // Club record's stored feature flags are authoritative (wizard can override per-club);
    // fall back to tier preset only when the record has none.
    features: (club.features && Object.keys(club.features).length > 0)
      ? club.features
      : resolveFeatures(club.product_tier || 'starter'),

    fixtures: staticConfig.fixtures,
    tiers: staticConfig.tiers,
    season: staticConfig.season,
    celebration: staticConfig.celebration,
    terminology: staticConfig.terminology,
  };
}

export function ClubProvider({ children }) {
  const { user, isLoadingAuth } = useAuth();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actingAs, setActingAs] = useState(null);
  const resolvedRef = useRef(false);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    resolveClub(user);
  }, [isLoadingAuth, user]);

  const setResolved = (clubRecord) => {
    const config = buildConfig(clubRecord);
    if (config.slug) sessionStorage.setItem(SS_KEY, config.slug);
    _currentConfig = config;
    setClub(config);
  };

  const resolveClub = async (authUser) => {
    setLoading(true);
    try {
      // (0) Platform owner acting-as → resolve that club first
      if (authUser?.is_platform_owner && sessionStorage.getItem(OWNER_ACTING_KEY)) {
        const actingSlug = sessionStorage.getItem(OWNER_ACTING_KEY);
        try {
          const actingClubs = await base44.entities.Club.filter({ slug: actingSlug });
          if (actingClubs[0]) {
            setResolved(actingClubs[0]);
            setActingAs(actingClubs[0]);
            return;
          }
        } catch { /* fall through to normal resolution */ }
      }

      // (a) Logged-in user's club_id → load that Club record
      if (authUser?.club_id) {
        try {
          const clubs = await base44.entities.Club.filter({ id: authUser.club_id });
          if (clubs[0]) {
            setResolved(clubs[0]);
            return;
          }
        } catch { /* fall through to next method */ }
      }

      // (b) URL param ?club=<slug> or path prefix /c/<slug>/
      let slug = null;
      const urlParams = new URLSearchParams(window.location.search);
      slug = urlParams.get('club');
      if (!slug) {
        const pathMatch = window.location.pathname.match(/^\/c\/([^\/]+)/);
        if (pathMatch) slug = pathMatch[1];
      }

      // (c) sessionStorage from a previous resolution
      if (!slug) {
        slug = sessionStorage.getItem(SS_KEY);
      }

      // (d) Transition rule — fallback so existing QR codes / root URL keep working
      if (!slug) slug = FALLBACK_SLUG;

      // Load Club by slug
      const clubs = await base44.entities.Club.filter({ slug });
      if (clubs[0]) {
        setResolved(clubs[0]);
      } else {
        console.warn(`[ClubContext] Club slug "${slug}" not found — falling back to static config`);
        _currentConfig = staticConfig;
        setClub(staticConfig);
      }
    } catch (error) {
      console.warn('[ClubContext] Club resolution failed — falling back to static config:', error);
      _currentConfig = staticConfig;
      setClub(staticConfig);
    } finally {
      setLoading(false);
    }
  };

  const features = club?.features || {};

  const exitActingAs = () => {
    sessionStorage.removeItem(OWNER_ACTING_KEY);
    window.location.reload();
  };

  // Neutral loading screen — no branding flash
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#000' }}>
        <div className="w-8 h-8 border-4 border-white/10 border-t-white/30 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ClubContext.Provider value={{ club, features, loading, actingAs, exitActingAs }}>
      {actingAs && <ActingAsBanner clubName={actingAs.name} onExit={exitActingAs} />}
      {children}
    </ClubContext.Provider>
  );
}

export function useClub() {
  const context = useContext(ClubContext);
  if (!context) {
    throw new Error('useClub must be used within a ClubProvider');
  }
  return context;
}
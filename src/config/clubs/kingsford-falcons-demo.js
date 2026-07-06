/**
 * Kingsford Falcons AFC — Club Configuration (Demo)
 * White-label demo profile for a Pro-tier AFL club build.
 */

import { resolveFeatures } from '../productTiers';

const clubConfig = {
  identity: {
    club_name: "Kingsford Falcons AFC",
    short_name: "the Falcons",
    sport: "afl",
    est_year: 1962,
    venue_name: "Memorial Oval",
    logo_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg",
    app_url: "",
    team_short: "Kingsford",
    club_short_name: "Kingsford Falcons",
    sport_emoji: "🦅"
  },

  theme: {
    bg0: "#07130C",
    bg1: "#0C2417",
    navy: "#14382A",
    royal: "#1E7A4F",
    cyan: "#7BE3A8",
    gold: "#F5A623",
    goldHi: "#FFC85C",
    green: "#1FBF8F",
    fontDisplay: "'Archivo Black', sans-serif",
    fontBody: "'Archivo', sans-serif"
  },

  product_tier: "pro",
  features: resolveFeatures("pro"),

  fixtures: {
    source: "playhq",
    source_url: "",
    verify_before_publish: true
  },

  tiers: [
    { name: "Supporter", price: 30, merch_discount_percent: 5 },
    { name: "Family", price: 50, merch_discount_percent: 10 },
    { name: "Premium", price: 65, merch_discount_percent: 15 }
  ],

  season: {
    year: 2026,
    label: "2026 SEASON"
  },

  celebration: {
    lines: ["UP THE FALCONS", "CARN THE FALCS", "MEMORIAL OVAL ROARS", "GREEN AND GOLD FOREVER"],
    points_per_checkin: 10,
    points_per_scan: 5
  },

  terminology: {
    first_grade: "Seniors",
    venue_short: "Memorial",
    join_headline: "Join the Falcons Family",
    members_word: "the Nest"
  }
};

export default clubConfig;
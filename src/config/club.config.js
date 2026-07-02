/**
 * Central Newcastle RLFC — Club Configuration
 * Single source of truth for club identity, theme tokens, feature flags,
 * fixture integration settings, and membership tier definitions.
 */

const clubConfig = {
  identity: {
    club_name: "Central Newcastle RLFC",
    short_name: "Butcher Boys",
    sport: "rugby_league",
    est_year: 1910,
    venue_name: "St John Oval",
    logo_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg",
    app_url: ""
  },

  theme: {
    bg0: "#060D1F",
    bg1: "#0B1730",
    navy: "#122B55",
    royal: "#2E5BF0",
    cyan: "#36C5F0",
    gold: "#F0B429",
    goldHi: "#FFD56B",
    green: "#1FBF8F",
    fontDisplay: "'Archivo Black', sans-serif",
    fontBody: "'Archivo', sans-serif"
  },

  features: {
    membership: true,
    day_pass: true,
    gate_scanning: true,
    fixtures: true,
    push_notifications: true,
    points_rewards: true,
    gamification: true,
    merch_shop: true,
    sponsor_portal: true,
    sponsor_dashboard: true,
    juniors: true,
    automations: true,
    social_posting: true,
    kpi_digest: true
  },

  fixtures: {
    source: "mysideline",
    source_url: "",
    verify_before_publish: true
  },

  tiers: [
    { name: "Supporter", price: 40, merch_discount_percent: 5 },
    { name: "Family", price: 60, merch_discount_percent: 10 },
    { name: "Premium", price: 75, merch_discount_percent: 20 },
    { name: "Old Butchers", price: 50, merch_discount_percent: 20 },
    { name: "Day Pass", price: 8, merch_discount_percent: 0 }
  ]
};

export default clubConfig;
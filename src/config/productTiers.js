/**
 * Product Tier Presets
 * White-label feature-flag layer — each preset enables a fixed set of features.
 * Clubs can override individual flags via resolveFeatures(tier, overrides).
 */

export const PRODUCT_TIERS = {
  starter: {
    membership: true,
    day_pass: true,
    gate_scanning: true,
    fixtures: true,
    push_notifications: false,
    points_rewards: false,
    gamification: false,
    merch_shop: false,
    sponsor_portal: true,
    sponsor_dashboard: false,
    juniors: false,
    automations: false,
    social_posting: false,
    kpi_digest: false
  },
  // GTM-aligned tier (Starter / Club / Club Pro / Elite / Founder)
  club: {
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
    juniors: false,
    automations: false,
    social_posting: false,
    kpi_digest: true
  },
  club_pro: {
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
    automations: false,
    social_posting: true,
    kpi_digest: true
  },
  // Legacy alias — same as 'club'; kept so existing resolveFeatures('pro') calls don't break
  pro: {
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
    juniors: false,
    automations: false,
    social_posting: false,
    kpi_digest: true
  },
  elite: {
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
  }
};

// Founder offer = full Elite experience for the first season
PRODUCT_TIERS.founder = { ...PRODUCT_TIERS.elite };

export function resolveFeatures(productTier, overrides = {}) {
  const preset = PRODUCT_TIERS[productTier] || PRODUCT_TIERS.starter;
  return { ...preset, ...overrides };
}
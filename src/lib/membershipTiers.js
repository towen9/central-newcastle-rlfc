export const PAID_TIERS = [
  'Premium Membership',
  'Family Membership',
  'Supporter Pack',
  'Old Butchers Membership',
  'Sponsor Season Pass'
];

export const DAY_PASS_TIER = 'Day Pass';

export const PAID_TIER_TYPES = ['supporter', 'family', 'premium', 'legacy', 'sponsor'];

export const DAY_PASS_TIER_TYPE = 'day_pass';

export const isPaidMember = (m) =>
  m.status === 'active' && (m.tier_type ? PAID_TIER_TYPES.includes(m.tier_type) : PAID_TIERS.some(t => m.tier_name?.includes(t)));

export const isDayPassMember = (m) =>
  m.status === 'active' && (m.tier_type ? m.tier_type === DAY_PASS_TIER_TYPE : m.tier_name === DAY_PASS_TIER);
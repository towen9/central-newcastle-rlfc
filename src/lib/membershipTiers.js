export const PAID_TIERS = [
  'Premium Membership',
  'Family Membership',
  'Supporter Pack',
  'Old Butchers Membership',
  'Sponsor Season Pass'
];

export const DAY_PASS_TIER = 'Day Pass';

export const isPaidMember = (m) =>
  m.status === 'active' && PAID_TIERS.some(t => m.tier_name?.includes(t));

export const isDayPassMember = (m) =>
  m.status === 'active' && m.tier_name === DAY_PASS_TIER;
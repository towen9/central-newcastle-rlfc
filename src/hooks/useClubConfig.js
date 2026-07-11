import { useClub } from '@/contexts/ClubContext';

/**
 * Returns the full club configuration object (same shape as the legacy
 * static clubConfig, but resolved dynamically from the Club database record).
 */
export function useClubConfig() {
  const { club } = useClub();
  return club;
}

/**
 * Renders children only when the named feature flag is enabled.
 */
export function FeatureGate({ feature, children }) {
  const { features } = useClub();
  const enabled = !!features?.[feature];
  return enabled ? children : null;
}
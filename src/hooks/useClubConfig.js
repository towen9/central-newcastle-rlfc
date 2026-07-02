import { useMemo } from 'react';
import clubConfig from '@/config/club.config';

/**
 * Returns the full club configuration object.
 */
export function useClubConfig() {
  return useMemo(() => clubConfig, []);
}

/**
 * Renders children only when the named feature flag is enabled in the config.
 * Renders nothing when the flag is false or missing.
 *
 * @param {string} feature — key from clubConfig.features
 */
export function FeatureGate({ feature, children }) {
  const config = useClubConfig();
  const enabled = !!config.features?.[feature];
  return enabled ? children : null;
}
import { useEffect } from 'react';

const VERSION_KEY = 'app_version_ts';
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const LAST_CHECK_KEY = 'app_version_last_check';

async function clearCachesAndReload() {
  if ('caches' in window) {
    const names = await caches.keys();
    await Promise.all(names.map(name => caches.delete(name)));
  }
  window.location.reload(true);
}

export default function useAppVersionCheck() {
  useEffect(() => {
    const check = async () => {
      try {
        const lastCheck = parseInt(localStorage.getItem(LAST_CHECK_KEY) || '0', 10);
        const now = Date.now();

        // Only check every 6 hours
        if (now - lastCheck < CHECK_INTERVAL_MS) return;
        localStorage.setItem(LAST_CHECK_KEY, String(now));

        // Fetch the app's own index.html with cache-busting to get the latest etag/version
        const res = await fetch(`/?_v=${now}`, { method: 'HEAD', cache: 'no-store' });
        const serverEtag = res.headers.get('etag') || res.headers.get('last-modified') || String(now);

        const storedVersion = localStorage.getItem(VERSION_KEY);

        if (!storedVersion) {
          // First time — just store it
          localStorage.setItem(VERSION_KEY, serverEtag);
          return;
        }

        if (storedVersion !== serverEtag) {
          // New version detected — clear and reload
          localStorage.setItem(VERSION_KEY, serverEtag);
          await clearCachesAndReload();
        }
      } catch {
        // Silent fail — don't disrupt the user
      }
    };

    check();
  }, []);
}
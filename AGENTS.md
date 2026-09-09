# Base44 Dev Environment

## What this app is
A Vite + React frontend ("Central Newcastle RLFC") that uses the Base44 SDK (`@base44/sdk`) and `@base44/vite-plugin` to connect to a Base44-hosted backend. There is no local database or backend — all data comes from the Base44 cloud.

## How to run
```bash
docker compose -f docker-compose.base44.yml up -d
```
The app is served on **host port 3000** (mapped to Vite's 5173 inside the container).

## Required credentials
Two env vars are required for the app to connect to its backend:
- `VITE_BASE44_APP_ID` = `6966ba172da6c09d1e1650bd`
- `VITE_BASE44_APP_BASE_URL` = `https://charlestown-rl-community-app-1e1650bd.base44.app`

Both are PUBLIC client-side identifiers (shipped in every frontend build) and are set in `.env.base44-defaults`. They were recovered from the repo itself — see `docs/wallet-pass-proxy.js` and `src/pages/StaffFAQ.jsx`, which reference the same app ID and URL. No dashboard secrets are needed.

NOTE: Two secrets with these names exist in the Base44 dashboard but hold malformed 45-char values (entered by mistake). The compose does NOT reference `/run/base44/app.env` on purpose — wiring it in would let those garbage values override the correct repo-derived ones and crash the Vite proxy. If the dashboard values are ever corrected to match the ones above, the env_file entry can safely be re-added (defaults first, app.env last).

The app requires authentication: on load, `AuthContext` calls `GET /api/apps/public/prod/public-settings/by-id/<appId>` and unauthenticated users get a 403 `auth_required` → redirect to Base44 login. That 403 is normal behavior, not an error.

Optional: `VITE_VAPID_PUBLIC_KEY` (web push notifications), `VITE_BASE44_FUNCTIONS_VERSION`.

## Compose notes
- Uses `node:22-slim` with the source bind-mounted at `/app`.
- `node_modules` is in a named volume to avoid host/platform conflicts.
- `npm install` runs on every container start; Vite dev server follows with `--host 0.0.0.0`.
- `.env.base44-defaults` provides placeholder values so the app boots without real credentials.
- Once real credentials are provided via the Base44 dashboard, add `env_file: /run/base44/app.env` back to the compose service (as the LAST entry) so user values override the placeholders.

## Verification
- `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/` should return `200`.
- The served HTML includes `/@vite/client` and `/@react-refresh` — confirming a live dev server, not a prebuilt bundle.
